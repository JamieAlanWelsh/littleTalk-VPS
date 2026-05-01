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

/** Returns the slots authored in a specific scene. */
export const getSceneSupportedSlots = (
    scene: ColourfulSemanticsScene,
): ColourfulSemanticsSlot[] => scene.steps.map((step) => step.slot);

/**
 * Minimum option count across ALL scenes for the given preset.
 * Only counts steps that are relevant to the preset for each scene.
 */
export const getMaxOptionsAcrossScenes = (
    scenes: ColourfulSemanticsScene[],
    presetId: ColourfulSemanticsPresetId,
): number => {
    const presetSlots = getSlotsForPreset(presetId);
    const perSceneLimits = scenes
        .map((scene) =>
            scene.steps.filter((step) => presetSlots.includes(step.slot)),
        )
        .filter((steps) => steps.length > 0)
        .flatMap((steps) => steps.map((step) => step.optionIds.length));

    if (perSceneLimits.length === 0) return 1;
    return Math.min(...perSceneLimits);
};

/**
 * Pick a random scene that is applicable to the given preset (has at least one
 * matching slot).  Falls back to the full list if none match.
 */
export const pickRandomScene = (
    scenes: ColourfulSemanticsScene[],
    presetId: ColourfulSemanticsPresetId,
    excludeSceneId?: string,
): ColourfulSemanticsScene => {
    const presetSlots = getSlotsForPreset(presetId);
    const applicable = scenes.filter((scene) =>
        scene.steps.some((step) => presetSlots.includes(step.slot)),
    );
    const pool = applicable.length > 0 ? applicable : scenes;
    const preferred = excludeSceneId
        ? pool.filter((s) => s.id !== excludeSceneId)
        : pool;
    const finalPool = preferred.length > 0 ? preferred : pool;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
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
