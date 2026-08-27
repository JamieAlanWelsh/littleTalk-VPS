import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );

    for (const scenePack of data.scenePacks ?? []) {
        for (const round of scenePack.rounds ?? []) {
            if (round.openingPrompt) strings.add(round.openingPrompt);
            // Matches the `That's right! ${completionPrompt}` promptOverride in InTheKnowGame.tsx.
            if (round.completionPrompt) {
                strings.add(`That's right! ${round.completionPrompt}`);
            }
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
