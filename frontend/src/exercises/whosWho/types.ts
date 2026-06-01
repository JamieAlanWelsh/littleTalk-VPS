import { z } from "zod";

export const WhosWhoPronounSchema = z.enum([
    "he",
    "she",
    "him",
    "her",
    "they",
    "them",
]);

export type WhosWhoPronoun = z.infer<typeof WhosWhoPronounSchema>;

export const WhosWhoPronouns = WhosWhoPronounSchema.options;

export const WhosWhoChoiceCountSchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
]);

export type WhosWhoChoiceCount = z.infer<typeof WhosWhoChoiceCountSchema>;

export const WhosWhoChoiceCounts = [1, 2, 3] as const;

export const WhosWhoSettingsSchema = z.object({
    choiceCount: WhosWhoChoiceCountSchema,
    selectedPronouns: z.array(WhosWhoPronounSchema).min(1),
});

export type WhosWhoSettings = z.infer<typeof WhosWhoSettingsSchema>;

export const WhosWhoItemSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    label: z.string(),
    altText: z.string().optional(),
});

export type WhosWhoItem = z.infer<typeof WhosWhoItemSchema>;

export const WhosWhoTargetImagesSchema = z.object({
    base: z.string(),
    reaching: z.string(),
    happy: z.string(),
});

export type WhosWhoTargetImages = z.infer<typeof WhosWhoTargetImagesSchema>;

export const WhosWhoTargetSchema = z.object({
    id: z.string(),
    images: WhosWhoTargetImagesSchema,
    label: z.string(),
    altText: z.string().optional(),
});

export type WhosWhoTarget = z.infer<typeof WhosWhoTargetSchema>;

export const WhosWhoTargetRoleSchema = z.enum(["boy", "girl", "group"]);

export type WhosWhoTargetRole = z.infer<typeof WhosWhoTargetRoleSchema>;

export const WhosWhoScenarioSchema = z.object({
    id: z.string(),
    pronoun: WhosWhoPronounSchema,
    prompt: z.string(),
    draggableItemId: z.string(),
    correctTargetId: z.string(),
    targetIds: z.array(z.string()).length(2),
    distractorItemIds: z.array(z.string()).max(2),
});

export type WhosWhoScenario = z.infer<typeof WhosWhoScenarioSchema>;

export const WhosWhoPromptTemplatesSchema = z.object({
    he: z.array(z.string()).min(1),
    she: z.array(z.string()).min(1),
    him: z.array(z.string()).min(1),
    her: z.array(z.string()).min(1),
    they: z.array(z.string()).min(1),
    them: z.array(z.string()).min(1),
});

export type WhosWhoPromptTemplates = z.infer<
    typeof WhosWhoPromptTemplatesSchema
>;

export const WhosWhoTargetPoolsSchema = z.object({
    boy: z.array(z.string()).min(1),
    girl: z.array(z.string()).min(1),
    group: z.array(z.string()).min(1),
});

export type WhosWhoTargetPools = z.infer<typeof WhosWhoTargetPoolsSchema>;

export const WhosWhoGenerationConfigSchema = z.object({
    promptTemplates: WhosWhoPromptTemplatesSchema,
    targetPools: WhosWhoTargetPoolsSchema,
});

export type WhosWhoGenerationConfig = z.infer<
    typeof WhosWhoGenerationConfigSchema
>;

export const WhosWhoExercisePayloadSchema = z.object({
    instruction: z.string(),
    modellingTip: z.string().optional(),
    rounds: z.number().int().positive(),
    items: z.array(WhosWhoItemSchema).min(3),
    targets: z.array(WhosWhoTargetSchema).min(3),
    generationConfig: WhosWhoGenerationConfigSchema,
    scenarios: z.array(WhosWhoScenarioSchema).optional(),
});

export type WhosWhoExercisePayload = z.infer<
    typeof WhosWhoExercisePayloadSchema
>;
