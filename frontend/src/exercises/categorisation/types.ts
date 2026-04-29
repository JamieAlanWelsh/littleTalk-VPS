/**
 * Categorisation Exercise Type Definitions
 *
 * Types specific to the categorisation exercise where users drag items
 * into category boxes to sort them by theme.
 */

import { z } from "zod";

export interface CategorisationOptions {
    selectedCategoryIds: string[];
    itemsPerCategory: number;
}

export const CategorisationItemSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    label: z.string(),
    sfxUrl: z.string().optional(),
});

export type CategorisationItem = z.infer<typeof CategorisationItemSchema>;

export const CategorisationExercisePayloadSchema = z.object({
    instruction: z.string(),
    modellingTip: z.string().optional(),
    categories: z.record(z.string(), z.array(CategorisationItemSchema)),
});

export type CategorisationExercisePayload = z.infer<
    typeof CategorisationExercisePayloadSchema
>;
