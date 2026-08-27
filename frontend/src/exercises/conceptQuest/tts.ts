import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDescriptivePrompt, getPrompt } from "./promptBuilder";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

const COMPLEXITIES = [1, 2, 3, 4] as const;

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );

    for (const imageSet of data.imageSets ?? []) {
        for (const concept of imageSet.supportedConcepts ?? []) {
            for (const complexity of COMPLEXITIES) {
                strings.add(getPrompt(concept, complexity, imageSet.subject));
            }
        }

        for (const item of imageSet.items ?? []) {
            strings.add(getDescriptivePrompt(item));
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
