import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

// Matches the hardcoded prompt in CategorisationGame.tsx (not the JSON "instruction" field).
const FIXED_PROMPT = "Move the words into the matching category";

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>([FIXED_PROMPT]);

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );

    for (const items of Object.values(data.categories) as Array<
        Array<{ label?: string }>
    >) {
        for (const item of items) {
            if (item.label) strings.add(item.label);
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
