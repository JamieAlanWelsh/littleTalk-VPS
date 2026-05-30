import { z } from "zod";

export const WhatHappensNextOptionSchema = z.object({
    id: z.string(),
    label: z.string(),
});

export type WhatHappensNextOption = z.infer<typeof WhatHappensNextOptionSchema>;

export const WhatHappensNextSceneSchema = z.object({
    id: z.string(),
    stepOneImageUrl: z.string(),
    stepTwoImageUrl: z.string(),
    stepOneAltText: z.string().optional(),
    stepTwoAltText: z.string().optional(),
    openingPrompt: z.string(),
    completionPrompt: z.string(),
    correctOptionId: z.string(),
    distractorOptionIds: z.array(z.string()).min(2),
});

export type WhatHappensNextScene = z.infer<typeof WhatHappensNextSceneSchema>;

export const WhatHappensNextPayloadSchema = z
    .object({
        rounds: z.number().int().positive(),
        options: z.array(WhatHappensNextOptionSchema).min(3),
        scenes: z.array(WhatHappensNextSceneSchema).min(1),
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

            if (scene.distractorOptionIds.includes(scene.correctOptionId)) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "Scene distractorOptionIds must not include correctOptionId",
                    path: ["scenes", sceneIndex, "distractorOptionIds"],
                });
            }

            scene.distractorOptionIds.forEach(
                (distractorOptionId, distractorIndex) => {
                    if (!validOptionIds.has(distractorOptionId)) {
                        context.addIssue({
                            code: z.ZodIssueCode.custom,
                            message:
                                "Scene distractorOptionIds must reference option ids",
                            path: [
                                "scenes",
                                sceneIndex,
                                "distractorOptionIds",
                                distractorIndex,
                            ],
                        });
                    }
                },
            );
        });
    });

export type WhatHappensNextPayload = z.infer<
    typeof WhatHappensNextPayloadSchema
>;
