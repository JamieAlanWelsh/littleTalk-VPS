import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    PROMPT_PHRASINGS,
    buildFindPrompt,
    getDescriptorFromBasePrompt,
} from "./promptBuilder";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );

    for (const imageSet of data.imageSets ?? []) {
        for (const item of imageSet.items ?? []) {
            if (!item.prompt) continue;
            const descriptor = getDescriptorFromBasePrompt(item.prompt);
            for (const phrasing of PROMPT_PHRASINGS) {
                strings.add(buildFindPrompt(phrasing, descriptor));
            }
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
