import { z } from "zod";

export const SPOT_ON_PREPOSITIONS = [
    "in",
    "on",
    "under",
    "next to",
    "above",
    "below",
    "between",
    "behind",
    "in front of",
] as const;

export type SpotOnPreposition = (typeof SPOT_ON_PREPOSITIONS)[number];

export const ImageSchema = z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string(),
    altText: z.string().optional(),
});

export type Image = z.infer<typeof ImageSchema>;

export const SpotOnExercisePayloadSchema = z.object({
    instruction: z.string(),
    modellingTip: z.string().optional(),
    rounds: z.number().int().positive(),
    characters: z.array(ImageSchema).min(1),
    objects: z.array(ImageSchema).min(1),
});

export type SpotOnExercisePayload = z.infer<typeof SpotOnExercisePayloadSchema>;

export interface SpotOnGridLocation {
    row: number;
    col: number;
}

export interface SpotOnQuestion {
    id: string;
    prompt: string;
    preposition: SpotOnPreposition;
    character: Image;
    object: Image;
}

export interface SpotOnOptions {
    selectedPrepositions: SpotOnPreposition[];
}
