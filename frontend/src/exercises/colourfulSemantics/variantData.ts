import sharedAssetPoolData from "./data/sharedAssetPool.json";
import advancedVariantData from "./data/advancedVariant.json";
import earlyYearsVariantData from "./data/earlyYearsVariant.json";
import standardVariantData from "./data/standardVariant.json";
import {
    ColourfulSemanticsAssetPoolSchema,
    ColourfulSemanticsPayloadSchema,
    COLOURFUL_SEMANTICS_ASSET_POOL_SLOT_IDS,
    ColourfulSemanticsVariantConfigSchema,
    ColourfulSemanticsVariantIdSchema,
    ColourfulSemanticsVariantPackSchema,
    type ColourfulSemanticsAssetPool,
    type ColourfulSemanticsOptionAllowlistBySlot,
    type ColourfulSemanticsPayload,
    type ColourfulSemanticsVariantConfig,
    type ColourfulSemanticsVariantId,
    type ColourfulSemanticsVariantPack,
} from "./types";

export const DEFAULT_COLOURFUL_SEMANTICS_VARIANT_ID: ColourfulSemanticsVariantId =
    "standard";

const getSharedAssetPool = () =>
    ColourfulSemanticsAssetPoolSchema.parse(sharedAssetPoolData);

const applyOptionAllowlistBySlot = ({
    assetPool,
    optionAllowlistBySlot,
}: {
    assetPool: ColourfulSemanticsAssetPool;
    optionAllowlistBySlot?: ColourfulSemanticsOptionAllowlistBySlot;
}): ColourfulSemanticsAssetPool => {
    if (!optionAllowlistBySlot) {
        return assetPool;
    }

    const nextAssetPool = { ...assetPool };

    for (const slotId of COLOURFUL_SEMANTICS_ASSET_POOL_SLOT_IDS) {
        const allowedOptionIds = optionAllowlistBySlot[slotId];

        if (!allowedOptionIds) {
            continue;
        }

        const allowedOptionIdSet = new Set(allowedOptionIds);

        nextAssetPool[slotId] = assetPool[slotId].filter((option) =>
            allowedOptionIdSet.has(option.id),
        );
    }

    return nextAssetPool;
};

const getVariantPacks = (): Record<
    ColourfulSemanticsVariantId,
    ColourfulSemanticsVariantPack
> => ({
    standard: ColourfulSemanticsVariantPackSchema.parse(standardVariantData),
    "early-years": ColourfulSemanticsVariantPackSchema.parse(
        earlyYearsVariantData,
    ),
    advanced: ColourfulSemanticsVariantPackSchema.parse(advancedVariantData),
});

export const resolveColourfulSemanticsVariantId = (
    requestedVariantId: string | null | undefined,
): ColourfulSemanticsVariantId => {
    const parsed =
        ColourfulSemanticsVariantIdSchema.safeParse(requestedVariantId);

    return parsed.success
        ? parsed.data
        : DEFAULT_COLOURFUL_SEMANTICS_VARIANT_ID;
};

const getVariantConfig = (
    variantPack: ColourfulSemanticsVariantPack,
): ColourfulSemanticsVariantConfig =>
    ColourfulSemanticsVariantConfigSchema.parse({
        id: variantPack.id,
        allowedPresetIds: variantPack.allowedPresetIds,
        defaultPresetId: variantPack.defaultPresetId,
        defaultNumberOfOptions: variantPack.defaultNumberOfOptions,
        maxNumberOfOptions: variantPack.maxNumberOfOptions,
        availableOptionalSlotIds: variantPack.availableOptionalSlotIds,
    });

export const getColourfulSemanticsVariantData = (
    variantId: ColourfulSemanticsVariantId,
): {
    payload: ColourfulSemanticsPayload;
    variant: ColourfulSemanticsVariantConfig;
} => {
    const variantPack = getVariantPacks()[variantId];

    return {
        payload: ColourfulSemanticsPayloadSchema.parse({
            ...applyOptionAllowlistBySlot({
                assetPool: getSharedAssetPool(),
                optionAllowlistBySlot: variantPack.optionAllowlistBySlot,
            }),
            scenes: variantPack.scenes,
        }),
        variant: getVariantConfig(variantPack),
    };
};
