/**
 * Custom hook for submitting exercise results using TanStack Query
 */

import { useMutation } from "@tanstack/react-query";
import {
    submitExerciseResult,
    submitGroupExerciseResult,
    type SubmitExerciseResultPayload,
} from "../api/submitExerciseResult";
import { useGroupContextValue } from "../contexts/GroupContext";
import { useLearnerContextValue } from "../contexts/LearnerContext";
import { readCsrfTokenFromCookie } from "../utils/cookies";

/**
 * Hook to submit exercise result
 * Returns mutation object with mutate function and status
 */
export function useSubmitExerciseResult() {
    const { groupId, isGroupMode } = useGroupContextValue();
    const { learnerUUID } = useLearnerContextValue();

    return useMutation({
        mutationFn: async (payload: SubmitExerciseResultPayload) => {
            if (isGroupMode) {
                if (!groupId) {
                    throw new Error(
                        "Group context not loaded. Unable to submit exercise result.",
                    );
                }

                const csrfToken = readCsrfTokenFromCookie();
                if (!csrfToken) {
                    throw new Error("CSRF token not found in cookies.");
                }

                return submitGroupExerciseResult(groupId, payload, csrfToken);
            }

            if (!learnerUUID) {
                throw new Error(
                    "Learner context not loaded. Unable to submit exercise result.",
                );
            }

            const csrfToken = readCsrfTokenFromCookie();
            if (!csrfToken) {
                throw new Error("CSRF token not found in cookies.");
            }

            return submitExerciseResult(learnerUUID, payload, csrfToken);
        },
    });
}
