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
            "/static/exercise_assets/colourful_semantics/level_icons/who.png",
        levelIconAlt: "Who level icon",
    },
    doing: {
        label: "doing",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/what_doing.png",
        levelIconAlt: "Doing level icon",
    },
    what: {
        label: "what",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/what.png",
        levelIconAlt: "What level icon",
    },
    where: {
        label: "where",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/where.png",
        levelIconAlt: "Where level icon",
    },
    "to-who": {
        label: "to who",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/to_who.png",
        levelIconAlt: "To Who level icon",
    },
    when: {
        label: "when",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/when.png",
        levelIconAlt: "When level icon",
    },
    "what-like": {
        label: "what like",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/what_like.png",
        levelIconAlt: "What Like level icon",
    },
    how: {
        label: "how",
        levelIconUrl:
            "/static/exercise_assets/colourful_semantics/level_icons/how.png",
        levelIconAlt: "How level icon",
    },
};
