import z from "zod";

export const PREPOSITIONS = [
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

export const prepositionsSchema = z.enum(PREPOSITIONS);
export type SpotOnPreposition = z.infer<typeof prepositionsSchema>;
