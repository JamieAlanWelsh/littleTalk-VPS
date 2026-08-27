import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );

    for (const scene of data.scenes ?? []) {
        if (scene.openingPrompt) strings.add(scene.openingPrompt);
        // Matches the `That's right! ${completionPrompt}` promptOverride in WhatHappensNextGame.tsx.
        if (scene.completionPrompt) {
            strings.add(`That's right! ${scene.completionPrompt}`);
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
