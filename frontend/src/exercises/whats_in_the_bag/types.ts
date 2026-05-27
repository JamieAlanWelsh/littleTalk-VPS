import { z } from "zod";

export const WhatsInTheBagItemSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    label: z.string(),
    altText: z.string().optional(),
});

export type WhatsInTheBagItem = z.infer<typeof WhatsInTheBagItemSchema>;

export const WhatsInTheBagBagImagesSchema = z.object({
    closedImageUrl: z.string(),
    openImageUrl: z.string(),
    closedAltText: z.string().optional(),
    openAltText: z.string().optional(),
});

export type WhatsInTheBagBagImages = z.infer<
    typeof WhatsInTheBagBagImagesSchema
>;

export const WhatsInTheBagPayloadSchema = z.object({
    rounds: z.number().int().positive(),
    bagImages: WhatsInTheBagBagImagesSchema,
    items: z.array(WhatsInTheBagItemSchema).min(3),
});

export type WhatsInTheBagPayload = z.infer<typeof WhatsInTheBagPayloadSchema>;

export interface WhatsInTheBagOptions {
    numberOfOptions: 1 | 2 | 3;
}
