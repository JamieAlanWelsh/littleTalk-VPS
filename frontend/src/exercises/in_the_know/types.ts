import { z } from "zod";

export const InTheKnowOptionSchema = z.object({
    id: z.string(),
    label: z.string(),
});

export type InTheKnowOption = z.infer<typeof InTheKnowOptionSchema>;

export const InTheKnowSceneSchema = z.object({
    id: z.string(),
    stepOneImageUrl: z.string(),
    stepTwoImageUrl: z.string(),
    stepOneAltText: z.string().optional(),
    stepTwoAltText: z.string().optional(),
    openingPrompt: z.string(),
    completionPrompt: z.string(),
    correctOptionId: z.string(),
});

export type InTheKnowScene = z.infer<typeof InTheKnowSceneSchema>;

export const InTheKnowPayloadSchema = z
    .object({
        rounds: z.number().int().positive(),
        options: z.array(InTheKnowOptionSchema).length(3),
        scenes: z.array(InTheKnowSceneSchema).min(1),
    })
    .superRefine((payload, context) => {
        const validOptionIds = new Set(
            payload.options.map((option) => option.id),
        );

        payload.scenes.forEach((scene, sceneIndex) => {
            if (!validOptionIds.has(scene.correctOptionId)) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "Scene correctOptionId must reference an option id",
                    path: ["scenes", sceneIndex, "correctOptionId"],
                });
            }
        });
    });

export type InTheKnowPayload = z.infer<typeof InTheKnowPayloadSchema>;
