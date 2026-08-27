import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toPromptItemText } from "./scenarioGenerator";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );
    const templatesByPronoun = data.generationConfig?.promptTemplates ?? {};
    const items = data.items ?? [];

    for (const templates of Object.values(templatesByPronoun) as string[][]) {
        for (const template of templates) {
            for (const item of items) {
                strings.add(
                    template.replaceAll("{item}", toPromptItemText(item)),
                );
            }
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
