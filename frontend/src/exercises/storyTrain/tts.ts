import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStoryTrainPrompt } from "./promptBuilder";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const dataFiles = ["exerciseData.json", "exerciseData.advanced.json"];
    for (const fileName of dataFiles) {
        const data = JSON.parse(
            fs.readFileSync(path.join(EXERCISE_DIR, fileName), "utf8"),
        );
        for (const set of data.sets ?? []) {
            if (set.title) strings.add(buildStoryTrainPrompt(set.title));
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
