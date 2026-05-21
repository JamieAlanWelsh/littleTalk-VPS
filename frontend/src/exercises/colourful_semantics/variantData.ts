import sharedAssetPoolData from "./data/sharedAssetPool.json";
import earlyYearsVariantData from "./data/earlyYearsVariant.json";
import standardVariantData from "./data/standardVariant.json";
import {
    ColourfulSemanticsAssetPoolSchema,
    ColourfulSemanticsPayloadSchema,
    ColourfulSemanticsVariantConfigSchema,
    ColourfulSemanticsVariantIdSchema,
    ColourfulSemanticsVariantPackSchema,
    type ColourfulSemanticsPayload,
    type ColourfulSemanticsVariantConfig,
    type ColourfulSemanticsVariantId,
    type ColourfulSemanticsVariantPack,
} from "./types";

export const DEFAULT_COLOURFUL_SEMANTICS_VARIANT_ID: ColourfulSemanticsVariantId =
    "standard";

const getSharedAssetPool = () =>
    ColourfulSemanticsAssetPoolSchema.parse(sharedAssetPoolData);

const getVariantPacks = (): Record<
    ColourfulSemanticsVariantId,
    ColourfulSemanticsVariantPack
> => ({
    standard: ColourfulSemanticsVariantPackSchema.parse(standardVariantData),
    "early-years": ColourfulSemanticsVariantPackSchema.parse(
        earlyYearsVariantData,
    ),
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
            ...getSharedAssetPool(),
            scenes: variantPack.scenes,
        }),
        variant: getVariantConfig(variantPack),
    };
};
