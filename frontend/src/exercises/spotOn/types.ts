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

export const DEFAULT_SPOT_ON_PREPOSITIONS: SpotOnPreposition[] = [
    "in",
    "on",
    "under",
];

export type SpotOnPreposition = (typeof SPOT_ON_PREPOSITIONS)[number];

export const ImageSchema = z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string(),
    altText: z.string().optional(),
});

export type Image = z.infer<typeof ImageSchema>;

// Helper for strict objectsByPreposition validation
const objectsByPrepositionSchema = z.record(
    z.enum(SPOT_ON_PREPOSITIONS),
    z.array(z.string().min(1)).min(1),
);

export const SpotOnExercisePayloadSchema = z
    .object({
        instruction: z.string(),
        modellingTip: z.string().optional(),
        rounds: z.number().int().positive(),
        characters: z.array(ImageSchema).min(1),
        objects: z.array(ImageSchema).min(1),
        objectsByPreposition: objectsByPrepositionSchema,
    })
    .superRefine((payload, ctx) => {
        // Ensure every preposition is present
        for (const prep of SPOT_ON_PREPOSITIONS) {
            if (
                !payload.objectsByPreposition[prep] ||
                payload.objectsByPreposition[prep].length === 0
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Missing or empty objectsByPreposition entry for preposition: ${prep}`,
                    path: ["objectsByPreposition", prep],
                });
            }
        }
        // Ensure every referenced object ID exists in objects
        const objectIds = new Set(payload.objects.map((obj) => obj.id));
        for (const [prep, ids] of Object.entries(
            payload.objectsByPreposition,
        )) {
            for (const id of ids) {
                if (!objectIds.has(id)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `objectsByPreposition for '${prep}' references unknown object id: ${id}`,
                        path: ["objectsByPreposition", prep],
                    });
                }
            }
        }
    });

export type SpotOnExercisePayload = z.infer<typeof SpotOnExercisePayloadSchema>;

export interface SpotOnExercisePayloadWithObjectsByPreposition extends Omit<
    SpotOnExercisePayload,
    "objectsByPreposition"
> {
    objectsByPreposition: Record<SpotOnPreposition, string[]>;
}

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
