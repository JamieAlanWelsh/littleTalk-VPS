/**
 * Exercise API Client hooks using TanStack Query
 */
export interface SubmitExerciseResultPayload {
    nonce: string;
    exp: number;
    totalExercises: number;
    exerciseId: string;
    difficultyLevel: number;
    difficultyLabel: string;
    startedAt: string; // ISO format datetime
    completedAt: string; // ISO format datetime
    totalQuestions: number;
    incorrectAnswers: number;
    attemptsPerQuestion: number[];
}

/**
 * Submit exercise completion result to Django backend.
 */
export async function submitExerciseResult(
    learnerUUID: string,
    payload: SubmitExerciseResultPayload,
    csrfToken: string,
): Promise<void> {
    const response = await fetch(
        `/api/learners/${learnerUUID}/submit-exercise/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({
                nonce: payload.nonce,
                exp: payload.exp,
                total_exercises: payload.totalExercises,
                exercise_id: payload.exerciseId,
                difficulty_level: payload.difficultyLevel,
                difficulty_label: payload.difficultyLabel,
                started_at: payload.startedAt,
                completed_at: payload.completedAt,
                total_questions: payload.totalQuestions,
                incorrect_answers: payload.incorrectAnswers,
                attempts_per_question: payload.attemptsPerQuestion,
            }),
        },
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            `Failed to submit exercise result: ${errorData.detail || response.statusText}`,
        );
    }
}
