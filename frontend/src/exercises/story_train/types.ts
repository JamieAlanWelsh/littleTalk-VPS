import { z } from "zod";

export const StoryTrainStepSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    label: z.string(),
    altText: z.string().optional(),
    order: z.number().int().min(0).max(2),
});

export type StoryTrainStep = z.infer<typeof StoryTrainStepSchema>;

export const StoryTrainSetSchema = z.object({
    id: z.string(),
    title: z.string(),
    steps: z.array(StoryTrainStepSchema).length(3),
});

export type StoryTrainSet = z.infer<typeof StoryTrainSetSchema>;

export const StoryTrainExercisePayloadSchema = z.object({
    instruction: z.string(),
    modellingTip: z.string().optional(),
    rounds: z.number().int().positive(),
    sets: z.array(StoryTrainSetSchema).min(3),
});

export type StoryTrainExercisePayload = z.infer<
    typeof StoryTrainExercisePayloadSchema
>;
