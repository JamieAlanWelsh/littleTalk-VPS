import type { ColourfulSemanticsSlot } from "./types";

export interface ColourfulSemanticsSlotMetadata {
    label: string;
    levelIconUrl: string;
    levelIconAlt: string;
}

export const COLOURFUL_SEMANTICS_SLOT_METADATA: Record<
    ColourfulSemanticsSlot,
    ColourfulSemanticsSlotMetadata
> = {
    who: {
        label: "who",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/who.webp",
        levelIconAlt: "Who level icon",
    },
    doing: {
        label: "doing",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/what_doing.webp",
        levelIconAlt: "Doing level icon",
    },
    what: {
        label: "what",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/what.webp",
        levelIconAlt: "What level icon",
    },
    where: {
        label: "where",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/where.webp",
        levelIconAlt: "Where level icon",
    },
    "to-who": {
        label: "to who",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/to_who.webp",
        levelIconAlt: "To Who level icon",
    },
    when: {
        label: "when",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/when.webp",
        levelIconAlt: "When level icon",
    },
    "what-like": {
        label: "what like",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/what_like.webp",
        levelIconAlt: "What Like level icon",
    },
    how: {
        label: "how",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/how.webp",
        levelIconAlt: "How level icon",
    },
};
