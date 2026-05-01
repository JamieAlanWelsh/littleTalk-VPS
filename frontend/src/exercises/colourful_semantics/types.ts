import { z } from "zod";

export const ColourfulSemanticsSlotSchema = z.enum([
    "who",
    "doing",
    "what",
    "where",
]);

export type ColourfulSemanticsSlot = z.infer<
    typeof ColourfulSemanticsSlotSchema
>;

export const ColourfulSemanticsPresetIdSchema = z.enum([
    "subject",
    "verb",
    "subject-verb",
    "subject-verb-object",
    "subject-verb-object-location",
]);

export type ColourfulSemanticsPresetId = z.infer<
    typeof ColourfulSemanticsPresetIdSchema
>;

export interface ColourfulSemanticsOptions {
    presetId: ColourfulSemanticsPresetId;
    numberOfOptions: number;
}

export const ColourfulSemanticsOptionSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    label: z.string(),
    sfxUrl: z.string().optional(),
    pluralLabel: z.string().optional(),
    pluralSfxUrl: z.string().optional(),
});

export type ColourfulSemanticsOption = z.infer<
    typeof ColourfulSemanticsOptionSchema
>;

export const ColourfulSemanticsStepSchema = z.object({
    id: z.string(),
    slot: ColourfulSemanticsSlotSchema,
    title: z.string(),
    prompt: z.string(),
    color: z.string(),
    levelIconUrl: z.string(),
    levelIconAlt: z.string(),
    correctOptionId: z.string(),
    optionIds: z.array(z.string()).min(2),
});

export type ColourfulSemanticsStep = z.infer<
    typeof ColourfulSemanticsStepSchema
>;

export interface ConfiguredColourfulSemanticsStep extends Omit<
    ColourfulSemanticsStep,
    "optionIds"
> {
    optionIds: string[];
}

export const ColourfulSemanticsSceneSchema = z.object({
    id: z.string(),
    title: z.string(),
    instruction: z.string(),
    modellingTip: z.string().optional(),
    targetImageUrl: z.string(),
    targetImageAlt: z.string(),
    steps: z
        .array(ColourfulSemanticsStepSchema)
        .min(1)
        .refine(
            (steps) => new Set(steps.map((s) => s.slot)).size === steps.length,
            { message: "Each slot must appear at most once per scene" },
        ),
});

export type ColourfulSemanticsScene = z.infer<
    typeof ColourfulSemanticsSceneSchema
>;

export interface ConfiguredColourfulSemanticsScene extends Omit<
    ColourfulSemanticsScene,
    "steps"
> {
    steps: ConfiguredColourfulSemanticsStep[];
}

export const ColourfulSemanticsPayloadSchema = z.object({
    who: z.array(ColourfulSemanticsOptionSchema).min(1),
    doing: z.array(ColourfulSemanticsOptionSchema).min(1),
    what: z.array(ColourfulSemanticsOptionSchema).min(1),
    where: z.array(ColourfulSemanticsOptionSchema).min(1),
    scenes: z.array(ColourfulSemanticsSceneSchema).min(1),
});

export type ColourfulSemanticsPayload = z.infer<
    typeof ColourfulSemanticsPayloadSchema
>;
