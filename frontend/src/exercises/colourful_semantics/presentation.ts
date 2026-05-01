import type {
    ColourfulSemanticsOption,
    ColourfulSemanticsScene,
    ColourfulSemanticsSlot,
} from "./types";

interface ResolvePresentationParams {
    item: ColourfulSemanticsOption;
    slot: ColourfulSemanticsSlot;
    isPluralSubject: boolean;
}

interface SubjectPluralityParams {
    itemsById: Record<string, ColourfulSemanticsOption>;
    scene: ColourfulSemanticsScene;
    selectionIds: Array<string | null>;
}

export const getIsPluralSubject = ({
    itemsById,
    scene,
    selectionIds,
}: SubjectPluralityParams): boolean => {
    const whoStepIndex = scene.steps.findIndex((step) => step.slot === "who");

    if (whoStepIndex === -1) {
        return false;
    }

    const whoSelectionId = selectionIds[whoStepIndex];

    if (!whoSelectionId) {
        return false;
    }

    return itemsById[whoSelectionId]?.isPlural === true;
};

export const resolveOptionPresentation = ({
    item,
    slot,
    isPluralSubject,
}: ResolvePresentationParams) => {
    if (slot !== "doing" || !isPluralSubject) {
        return {
            label: item.label,
            sfxUrl: item.sfxUrl,
        };
    }

    return {
        label: item.pluralLabel ?? item.label,
        sfxUrl: item.pluralSfxUrl ?? item.sfxUrl,
    };
};
