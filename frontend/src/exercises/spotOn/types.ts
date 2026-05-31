import { z } from "zod";
import type { SpotOnPreposition } from "../../types";

export type { SpotOnPreposition } from "../../types";

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
