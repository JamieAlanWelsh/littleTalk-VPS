import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

// Matches the hardcoded prompt states in WhatsInTheBagGame.tsx.
const FIXED_PROMPTS = ["What's in the bag?", "What is it?"];

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>(FIXED_PROMPTS);

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );

    for (const item of data.items ?? []) {
        const promptLabel = item.altText ?? item.label;
        if (promptLabel) strings.add(`That's right! It's ${promptLabel}`);
        // TextOptionGroup word options speak this exact label on click.
        if (item.label) strings.add(item.label);
    }

    return [...strings];
};

export default getSpeakableStrings;
