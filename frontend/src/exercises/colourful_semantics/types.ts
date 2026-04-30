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

export const ColourfulSemanticsSceneSchema = z.object({
    id: z.string(),
    title: z.string(),
    instruction: z.string(),
    modellingTip: z.string().optional(),
    targetImageUrl: z.string(),
    targetImageAlt: z.string(),
    steps: z.array(ColourfulSemanticsStepSchema).length(4),
});

export type ColourfulSemanticsScene = z.infer<
    typeof ColourfulSemanticsSceneSchema
>;

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
