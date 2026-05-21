import { shuffleArray } from "../../utils/shuffleArray";
import type {
    ColourfulSemanticsBaseSlot,
    ColourfulSemanticsOptions,
    ColourfulSemanticsOptionalSlot,
    ColourfulSemanticsPresetId,
    ColourfulSemanticsScene,
    ColourfulSemanticsSlot,
    ColourfulSemanticsVariantConfig,
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
): ColourfulSemanticsBaseSlot[] => PRESET_SLOTS[presetId];

const insertOptionalSlot = ({
    slots,
    optionalSlot,
}: {
    slots: ColourfulSemanticsSlot[];
    optionalSlot: ColourfulSemanticsOptionalSlot;
}): ColourfulSemanticsSlot[] => {
    if (optionalSlot === "when") {
        const withoutWhen = slots.filter((slot) => slot !== "when");
        return [...withoutWhen, "when"];
    }

    const withoutWhen = slots.filter((slot) => slot !== "when");
    const hasWhen = slots.includes("when");

    if (withoutWhen.includes(optionalSlot)) {
        return slots;
    }

    if (optionalSlot === "to-who") {
        const whereIndex = withoutWhen.indexOf("where");

        if (whereIndex !== -1) {
            const nextSlots = [
                ...withoutWhen.slice(0, whereIndex),
                optionalSlot,
                ...withoutWhen.slice(whereIndex),
            ];

            return hasWhen ? [...nextSlots, "when"] : nextSlots;
        }

        const whatIndex = withoutWhen.indexOf("what");

        if (whatIndex !== -1) {
            const nextSlots = [
                ...withoutWhen.slice(0, whatIndex + 1),
                optionalSlot,
                ...withoutWhen.slice(whatIndex + 1),
            ];

            return hasWhen ? [...nextSlots, "when"] : nextSlots;
        }
    }

    const nextSlots = [...withoutWhen, optionalSlot];
    return hasWhen ? [...nextSlots, "when"] : nextSlots;
};

export const getActiveSlotsForScene = ({
    scene,
    options,
    variant,
}: {
    scene: ColourfulSemanticsScene;
    options: ColourfulSemanticsOptions;
    variant: ColourfulSemanticsVariantConfig;
}): ColourfulSemanticsSlot[] => {
    const authoredSlots = new Set(scene.steps.map((step) => step.slot));
    const activeBaseSlots = getSlotsForPreset(options.presetId).filter((slot) =>
        authoredSlots.has(slot),
    );

    if (variant.id !== "advanced") {
        return activeBaseSlots;
    }

    return options.enabledOptionalSlotIds.reduce<ColourfulSemanticsSlot[]>(
        (slots, optionalSlot) => {
            if (!authoredSlots.has(optionalSlot)) {
                return slots;
            }

            return insertOptionalSlot({
                slots,
                optionalSlot,
            });
        },
        [...activeBaseSlots],
    );
};

export const getDefaultOptionsForVariant = (
    variant: ColourfulSemanticsVariantConfig,
): ColourfulSemanticsOptions => ({
    presetId: variant.defaultPresetId,
    numberOfOptions: variant.defaultNumberOfOptions,
    enabledOptionalSlotIds: [],
});

export const sanitizeOptionsForVariant = ({
    options,
    scenes,
    variant,
}: {
    options: ColourfulSemanticsOptions;
    scenes: ColourfulSemanticsScene[];
    variant: ColourfulSemanticsVariantConfig;
}): ColourfulSemanticsOptions => {
    const presetId = variant.allowedPresetIds.includes(options.presetId)
        ? options.presetId
        : variant.defaultPresetId;
    const enabledOptionalSlotIds = variant.availableOptionalSlotIds.filter(
        (slotId, index, availableOptionalSlotIds) =>
            options.enabledOptionalSlotIds.includes(slotId) &&
            availableOptionalSlotIds.indexOf(slotId) === index,
    );
    const maxOptions = Math.min(
        5,
        getMaxOptionsAcrossScenes(
            scenes,
            {
                ...options,
                presetId,
                enabledOptionalSlotIds,
            },
            variant,
        ),
    );

    return {
        presetId,
        numberOfOptions: Math.max(
            1,
            Math.min(options.numberOfOptions, maxOptions),
        ),
        enabledOptionalSlotIds,
    };
};

export const getMaxOptionsForScene = (
    scene: ColourfulSemanticsScene,
    options: ColourfulSemanticsOptions,
    variant: ColourfulSemanticsVariantConfig,
) => {
    const slots = getActiveSlotsForScene({
        scene,
        options,
        variant,
    });

    if (slots.length === 0) {
        return 1;
    }

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
    options: ColourfulSemanticsOptions,
    variant: ColourfulSemanticsVariantConfig,
): number => {
    const perSceneLimits = scenes
        .map((scene) => {
            const activeSlots = getActiveSlotsForScene({
                scene,
                options,
                variant,
            });

            return scene.steps.filter((step) =>
                activeSlots.includes(step.slot),
            );
        })
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
    options: ColourfulSemanticsOptions,
    variant: ColourfulSemanticsVariantConfig,
    excludeSceneIds?: string[],
): ColourfulSemanticsScene => {
    const applicable = scenes.filter(
        (scene) =>
            getActiveSlotsForScene({
                scene,
                options,
                variant,
            }).length > 0,
    );
    const pool = applicable.length > 0 ? applicable : scenes;
    const preferred = excludeSceneIds?.length
        ? pool.filter((s) => !excludeSceneIds.includes(s.id))
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
    variant,
}: {
    scene: ColourfulSemanticsScene;
    options: ColourfulSemanticsOptions;
    variant: ColourfulSemanticsVariantConfig;
}): ConfiguredColourfulSemanticsScene => {
    const configuredSlots = getActiveSlotsForScene({
        scene,
        options,
        variant,
    });
    const stepsBySlot = new Map(scene.steps.map((step) => [step.slot, step]));

    return {
        ...scene,
        steps: configuredSlots
            .map((slot) => stepsBySlot.get(slot))
            .filter((step) => step != null)
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
