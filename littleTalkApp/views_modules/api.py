import json
import logging

from django.core.cache import cache
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from littleTalkApp.models import ExerciseSession, Learner
from littleTalkApp.serializers import LearnerExpUpdateInputSerializer, LearnerExpUpdateSerializer

logger = logging.getLogger(__name__)


class CanUpdateLearnerPermission(BasePermission):
    """Custom DRF permission that allows updates only to learners the user owns.

    Parents may only update their own learners. School staff (staff/manager/admin)
    may only update learners belonging to their currently selected school.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        profile = getattr(user, "profile", None)
        if not profile:
            return False

        learner = obj

        if profile.is_parent():
            return learner.user == user
        if profile.is_staff() or profile.is_manager() or profile.is_admin():
            current_school = profile.get_current_school(request)
            if current_school:
                return learner.school == current_school
            return False
        return False


class UpdateLearnerExpAPIView(APIView):
    """API endpoint (POST /api/learners/<learner_uuid>/update-exp/) that increments a
    learner's XP and exercise count after completing a game session. Accepts a nonce
    to prevent duplicate submissions. Optionally records a full ExerciseSession record.
    """

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated, CanUpdateLearnerPermission]

    def post(self, request, learner_uuid):
        learner = get_object_or_404(Learner, learner_uuid=learner_uuid)
        self.check_object_permissions(request, learner)

        input_serializer = LearnerExpUpdateInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        nonce = input_serializer.validated_data["nonce"]
        cache_key = f"nonce_{request.user.id}_{nonce}"
        if cache.get(cache_key):
            return Response({"detail": "Nonce already used."}, status=status.HTTP_400_BAD_REQUEST)

        new_exp = input_serializer.validated_data["exp"]
        new_total_exercises = input_serializer.validated_data["total_exercises"]

        learner.exp += new_exp
        learner.total_exercises += new_total_exercises
        learner.save()

        if "exercise_id" in input_serializer.validated_data:
            ExerciseSession.objects.create(
                learner=learner,
                exercise_id=input_serializer.validated_data["exercise_id"],
                difficulty_selected=input_serializer.validated_data.get("difficulty_selected", ""),
                started_at=input_serializer.validated_data["started_at"],
                completed_at=input_serializer.validated_data["completed_at"],
                total_questions=input_serializer.validated_data["total_questions"],
                incorrect_answers=input_serializer.validated_data["incorrect_answers"],
                attempts_per_question=input_serializer.validated_data["attempts_per_question"],
            )

        cache.set(cache_key, True, 600)

        logger.info(
            "User %s updated learner %s: exp +%s, exercises +%s",
            request.user.username,
            learner.id,
            new_exp,
            new_total_exercises,
        )

        serializer = LearnerExpUpdateSerializer(learner)
        return Response(serializer.data, status=status.HTTP_200_OK)


def get_selected_learner(request):
    """JSON API: returns the UUID, CSRF token, and CS level of the learner currently
    stored in the session. Returns 401 if unauthenticated or 400 if no learner is selected.
    """

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    csrf_token = get_token(request)
    selected_learner_id = request.session.get("selected_learner_id")

    if selected_learner_id:
        selected_learner = Learner.objects.get(id=selected_learner_id)
        return JsonResponse(
            {
                "learner_uuid": str(selected_learner.learner_uuid),
                "csrf_token": csrf_token,
                "cs_level": selected_learner.assessment2,
            }
        )
    return JsonResponse({"error": "No learner selected"}, status=400)


@login_required
def create_target(request):
    """JSON API (POST): creates a new Target for a learner identified by learner_uuid
    in the request body. Enforces ownership checks for both parent and school-staff users.
    Returns the created target data with HTTP 201 on success.
    """

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
        learner_uuid = data.get("learner_uuid")
        target_text = data.get("text", "").strip()
        status_value = data.get("status", "---")

        if not learner_uuid or not target_text:
            return JsonResponse({"error": "Missing required fields"}, status=400)

        learner = get_object_or_404(Learner, learner_uuid=learner_uuid)

        if request.user.profile.is_parent():
            if learner not in request.user.profile.parent_profile.learners.all():
                return JsonResponse({"error": "Permission denied"}, status=403)
        else:
            if learner.school != request.user.profile.get_current_school(request):
                return JsonResponse({"error": "Permission denied"}, status=403)

        from littleTalkApp.models import Target

        target = Target.objects.create(learner=learner, text=target_text, status=status_value)

        return JsonResponse(
            {
                "id": target.id,
                "text": target.text,
                "status": target.status,
                "created_at": target.created_at.isoformat(),
            },
            status=201,
        )

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as exc:
        logger.error("Error creating target: %s", str(exc))
        return JsonResponse({"error": "Error creating target"}, status=500)


@login_required
def target_detail(request, target_id):
    """JSON API (GET / PATCH / DELETE) for a single Target by ID. GET returns the
    target data; PATCH updates text and/or status; DELETE removes the record.
    Enforces ownership checks for parents and school-staff users.
    """

    from littleTalkApp.models import Target

    target = get_object_or_404(Target, id=target_id)

    if request.user.profile.is_parent():
        if target.learner not in request.user.profile.parent_profile.learners.all():
            return JsonResponse({"error": "Permission denied"}, status=403)
    else:
        if target.learner.school != request.user.profile.get_current_school(request):
            return JsonResponse({"error": "Permission denied"}, status=403)

    if request.method == "GET":
        return JsonResponse(
            {
                "id": target.id,
                "text": target.text,
                "status": target.status,
                "created_at": target.created_at.isoformat(),
            }
        )

    if request.method == "PATCH":
        try:
            data = json.loads(request.body)

            if "text" in data:
                target.text = data["text"].strip()

            if "status" in data:
                target.status = data["status"]

            target.save()

            return JsonResponse(
                {
                    "id": target.id,
                    "text": target.text,
                    "status": target.status,
                    "updated_at": target.updated_at.isoformat(),
                }
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Exception as exc:
            logger.error("Error updating target: %s", str(exc))
            return JsonResponse({"error": "Error updating target"}, status=500)

    if request.method == "DELETE":
        target.delete()
        return JsonResponse({"status": "deleted"}, status=204)

    return JsonResponse({"error": "Method not allowed"}, status=405)
