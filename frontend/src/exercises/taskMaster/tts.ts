import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );

    for (const task of data.tasks ?? []) {
        for (const question of task.questions ?? []) {
            if (question.question) strings.add(question.question);
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
