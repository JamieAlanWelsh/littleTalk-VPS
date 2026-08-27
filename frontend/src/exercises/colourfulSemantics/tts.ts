import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "data",
);

const LABEL_FIELDS = [
    "label",
    "pluralLabel",
    "pastTenseLabel",
    "whatLikeVariantLabel",
] as const;

// Collects every prompt and word-option label spoken across all Colourful Semantics variants.
export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const variantFiles = [
        "standardVariant.json",
        "earlyYearsVariant.json",
        "advancedVariant.json",
    ];
    for (const fileName of variantFiles) {
        const filePath = path.join(DATA_DIR, fileName);
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        for (const scene of data.scenes ?? []) {
            for (const step of scene.steps ?? []) {
                if (step.prompt) strings.add(step.prompt);
            }
        }
    }

    const assetPool = JSON.parse(
        fs.readFileSync(path.join(DATA_DIR, "sharedAssetPool.json"), "utf8"),
    );
    for (const options of Object.values(assetPool) as Array<
        Array<Record<string, string>>
    >) {
        for (const option of options) {
            for (const field of LABEL_FIELDS) {
                if (option[field]) strings.add(option[field]);
            }
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
