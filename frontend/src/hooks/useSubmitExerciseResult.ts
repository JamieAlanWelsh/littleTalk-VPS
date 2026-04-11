/**
 * Custom hook for submitting exercise results using TanStack Query
 */

import { useMutation } from "@tanstack/react-query";
import {
  submitExerciseResult,
  type SubmitExerciseResultPayload,
} from "../api/submitExerciseResult";
import { useLearnerContextValue } from "../contexts/LearnerContext";
import { readCsrfTokenFromCookie } from "../utils/cookies";

/**
 * Hook to submit exercise result
 * Returns mutation object with mutate function and status
 */
export function useSubmitExerciseResult() {
  const { learnerUUID } = useLearnerContextValue();

  return useMutation({
    mutationFn: async (payload: SubmitExerciseResultPayload) => {
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
