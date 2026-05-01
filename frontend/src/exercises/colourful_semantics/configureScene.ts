import { shuffleArray } from "../../utils/shuffleArray";
import type {
    ColourfulSemanticsOptions,
    ColourfulSemanticsPresetId,
    ColourfulSemanticsScene,
    ColourfulSemanticsSlot,
    ConfiguredColourfulSemanticsScene,
} from "./types";

const PRESET_SLOTS: Record<
    ColourfulSemanticsPresetId,
    ColourfulSemanticsSlot[]
> = {
    subject: ["who"],
    verb: ["doing"],
    "subject-verb": ["who", "doing"],
    "subject-verb-object": ["who", "doing", "what"],
    "subject-verb-object-location": ["who", "doing", "what", "where"],
};

export const getSlotsForPreset = (
    presetId: ColourfulSemanticsPresetId,
): ColourfulSemanticsSlot[] => PRESET_SLOTS[presetId];

export const getMaxOptionsForPreset = (
    scene: ColourfulSemanticsScene,
    presetId: ColourfulSemanticsPresetId,
) => {
    const slots = getSlotsForPreset(presetId);

    return Math.min(
        ...scene.steps
            .filter((step) => slots.includes(step.slot))
            .map((step) => step.optionIds.length),
    );
};

const getConfiguredOptionIds = ({
    optionIds,
    correctOptionId,
    numberOfOptions,
}: {
    optionIds: string[];
    correctOptionId: string;
    numberOfOptions: number;
}) => {
    const distractorIds = optionIds.filter(
        (optionId) => optionId !== correctOptionId,
    );
    const sampledDistractorIds = shuffleArray(distractorIds).slice(
        0,
        Math.max(0, numberOfOptions - 1),
    );

    return shuffleArray([correctOptionId, ...sampledDistractorIds]);
};

export const configureScene = ({
    scene,
    options,
}: {
    scene: ColourfulSemanticsScene;
    options: ColourfulSemanticsOptions;
}): ConfiguredColourfulSemanticsScene => {
    const configuredSlots = getSlotsForPreset(options.presetId);

    return {
        ...scene,
        steps: scene.steps
            .filter((step) => configuredSlots.includes(step.slot))
            .map((step) => ({
                ...step,
                optionIds: getConfiguredOptionIds({
                    optionIds: step.optionIds,
                    correctOptionId: step.correctOptionId,
                    numberOfOptions: Math.min(
                        options.numberOfOptions,
                        step.optionIds.length,
                    ),
                }),
            })),
    };
};
