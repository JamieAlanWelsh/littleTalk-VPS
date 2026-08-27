import type {
    ConceptQuestComplexity,
    ConceptQuestConcept,
    ConceptQuestItem,
} from "../../lib/types";

export const WORD_FORMS: Record<ConceptQuestConcept, [string, string, string]> =
    {
        big: ["big", "bigger", "biggest"],
        small: ["small", "smaller", "smallest"],
        short: ["short", "shorter", "shortest"],
        long: ["long", "longer", "longest"],
        tall: ["tall", "taller", "tallest"],
        thick: ["thick", "thicker", "thickest"],
        thin: ["thin", "thinner", "thinnest"],
    };

export const getMiddlePrompt = (concept: ConceptQuestConcept) => {
    const [, comparative, superlative] = WORD_FORMS[concept];
    return `${comparative} but not ${superlative}`;
};

export const getPrompt = (
    concept: ConceptQuestConcept,
    complexity: ConceptQuestComplexity,
    subject: string,
) =>
    complexity === 4
        ? `Which ${subject} is ${getMiddlePrompt(concept)}?`
        : `Which ${subject} is ${WORD_FORMS[concept][complexity - 1]}?`;

export const getDescriptivePrompt = (item: ConceptQuestItem) =>
    `Can you show me ${item.altText ?? item.label}?`;
