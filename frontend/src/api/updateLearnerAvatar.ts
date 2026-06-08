export interface UpdateLearnerAvatarPayload {
    avatar_character: string;
    avatar_color: string;
}

export interface LearnerAvatarResponse {
    avatar_character: string;
    avatar_color: string;
}

export async function updateLearnerAvatar(
    saveUrl: string,
    payload: UpdateLearnerAvatarPayload,
    csrfToken: string,
): Promise<LearnerAvatarResponse> {
    const response = await fetch(saveUrl, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorMessage = "Failed to update learner avatar.";
        try {
            const errorData = (await response.json()) as Record<
                string,
                string[] | string
            >;
            const firstError = Object.values(errorData)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
                errorMessage = firstError[0];
            } else if (typeof firstError === "string") {
                errorMessage = firstError;
            }
        } catch {
            // Keep fallback message for non-JSON responses.
        }

        throw new Error(errorMessage);
    }

    return (await response.json()) as LearnerAvatarResponse;
}
