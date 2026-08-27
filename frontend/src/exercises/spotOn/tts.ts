import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPrompt, getPromptObjectName } from "./generateQuestions";
import { SPOT_ON_PREPOSITIONS } from "./types";

const EXERCISE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const getSpeakableStrings = (): string[] => {
    const strings = new Set<string>();

    const data = JSON.parse(
        fs.readFileSync(path.join(EXERCISE_DIR, "exerciseData.json"), "utf8"),
    );
    const objectsById = new Map<string, { name: string }>(
        (data.objects ?? []).map((object: { id: string; name: string }) => [
            object.id,
            object,
        ]),
    );

    for (const character of data.characters ?? []) {
        for (const preposition of SPOT_ON_PREPOSITIONS) {
            const objectIds = data.objectsByPreposition?.[preposition] ?? [];
            for (const objectId of objectIds) {
                const object = objectsById.get(objectId);
                if (!object) continue;

                const promptObjectName = getPromptObjectName(
                    preposition,
                    object.name,
                );
                strings.add(
                    buildPrompt(character.name, preposition, promptObjectName),
                );
            }
        }
    }

    return [...strings];
};

export default getSpeakableStrings;
