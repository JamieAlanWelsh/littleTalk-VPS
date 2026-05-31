import { z } from "zod";

export const InTheKnowChoiceCountSchema = z.union([
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
]);

export type InTheKnowChoiceCount = z.infer<typeof InTheKnowChoiceCountSchema>;

export const InTheKnowChoiceCounts = [3, 4, 5, 6] as const;

export const InTheKnowRoundSchema = z.object({
    id: z.string(),
    openingPrompt: z.string(),
    completionPrompt: z.string(),
    correctOptionLabel: z.string(),
    distractorOptionLabels: z.array(z.string()).length(10),
    stepTwoImageUrl: z.string(),
    stepTwoAltText: z.string().optional(),
});

export type InTheKnowRound = z.infer<typeof InTheKnowRoundSchema>;

export const InTheKnowScenePackSchema = z.object({
    id: z.string(),
    stepOneImageUrl: z.string(),
    stepOneAltText: z.string().optional(),
    rounds: z.array(InTheKnowRoundSchema).length(5),
});

export type InTheKnowScenePack = z.infer<typeof InTheKnowScenePackSchema>;

export const InTheKnowPayloadSchema = z
    .object({
        rounds: z.number().int().positive(),
        scenePacks: z.array(InTheKnowScenePackSchema).min(1),
    })
    .superRefine((payload, context) => {
        payload.scenePacks.forEach((scenePack, scenePackIndex) => {
            scenePack.rounds.forEach((round, roundIndex) => {
                if (
                    round.distractorOptionLabels.includes(
                        round.correctOptionLabel,
                    )
                ) {
                    context.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "Round distractorOptionLabels must not include correctOptionLabel",
                        path: [
                            "scenePacks",
                            scenePackIndex,
                            "rounds",
                            roundIndex,
                            "distractorOptionLabels",
                        ],
                    });
                }
            });
        });
    });

export type InTheKnowPayload = z.infer<typeof InTheKnowPayloadSchema>;
