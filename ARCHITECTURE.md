# littleTalk Architecture & Design

This document maps out how the application components fit together, key data flows, and code dependencies to identify coupling and potential refactoring opportunities.

---

## Session Management

### Selected Learner Session State

**What it does:** Tracks which learner is currently "active" for the logged-in user. Since a user can have multiple learners (parents have children, staff manage school learners), this session value disambiguates which learner operations should apply to.

**Where it's set:**
- [profile.py](littleTalkApp/views_modules/profile.py#L63) — Auto-selects first available learner on profile load
- [profile.py](littleTalkApp/views_modules/profile.py#L108) — Set when adding a new learner
- [profile.py](littleTalkApp/views_modules/profile.py#L128) — `select_learner()` view when user switches between learners
- [assessment.py](littleTalkApp/views_modules/assessment.py) — Set after assessment completion

**Where it's read:**
- [api.py](littleTalkApp/views_modules/api.py#L101) — `get_current_session_learner_context()` returns it as JSON for frontend
- [profile.py](littleTalkApp/views_modules/profile.py#L54)
- [logbook.py](littleTalkApp/views_modules/logbook.py#L73)
- [dashboard.py](littleTalkApp/views_modules/dashboard.py#L57)
- [assessment.py](littleTalkApp/views_modules/assessment.py#L63)
- [practise.py](littleTalkApp/views_modules/practise.py#L41)

**Where it's deleted:**
- [profile.py](littleTalkApp/views_modules/profile.py#L220) — Removed when learner is deleted

**Dependency note:** Multiple views depend on this session value. The frontend fetches it via `get_current_session_learner_context()` API to know which learner UUID to target for exercise submissions.

---

## API Endpoints

### Exercise Submission

**Endpoint:** `POST /api/learners/<learner_uuid>/update-exp/`

**Class:** [SubmitExerciseView](littleTalkApp/views_modules/api.py)

**What it does:**
- Increments learner's XP and total exercise count
- Optionally creates an ExerciseSession record with detailed metrics (accuracy, timing, attempts, etc.)
- Uses nonce-based deduplication to prevent duplicate submissions
- Enforces permission checks via `CanUpdateLearnerPermission`

**Frontend integration:** Currently used by [useSubmitExerciseResult()](frontend/src/hooks/useExercise.ts) hook in TanStack Query

---

## Data Models

### Learner

**Purpose:** Represents a student/learner in the system.

**Fields:**
- `id` (integer PK) — Used internally for database queries and relationships
- `learner_uuid` (UUIDField) — Used in APIs to prevent enumeration; allows safe external access
- `exp` — Total XP accumulated
- `total_exercises` — Cumulative exercise count
- `assessment1`, `assessment2` — Assessment scores

**Relationship:** ForeignKey to User (many learners per user)

**Note:** See [notes.md](notes.md#todo) for potential future refactoring to UUID-only primary key.

### ExerciseSession

**Purpose:** Detailed record of a single exercise completion.

**Key fields:**
- `learner` — FK to Learner
- `exercise_id`, `difficulty_selected` — Exercise type and difficulty
- `started_at`, `completed_at` — Session timing
- `total_questions`, `incorrect_answers`, `attempts_per_question` — Performance data
- `created_at` — Indexed for querying progress over time

**Notable indexes:**
- `(learner, created_at)` — For fetching a learner's history
- `(learner, exercise_id, created_at)` — For filtering by exercise type

---

## TODO / Known Refactoring Opportunities

- [ ] Add `accuracy_percentage` and `exp_earned` fields to ExerciseSession model
- [ ] Refactor nonce-based deduplication to idempotency keys (HTTP header standard)
- [ ] Create headteacher progress visualization endpoints

---

*Last updated: April 4, 2026*
