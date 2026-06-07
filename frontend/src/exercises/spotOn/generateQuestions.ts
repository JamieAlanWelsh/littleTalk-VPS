import {
    SPOT_ON_PREPOSITIONS,
    type SpotOnExercisePayload,
    type SpotOnPreposition,
    type SpotOnQuestion,
} from "./types";

const buildPrompt = (
    characterName: string,
    preposition: SpotOnPreposition,
    objectName: string,
) => `Put ${characterName} ${preposition} the ${objectName}.`;

const pickRandom = <T>(items: T[]): T =>
    items[Math.floor(Math.random() * items.length)];

const shuffleArray = <T>(items: T[]): T[] => {
    const shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const currentItem = shuffledItems[index];
        shuffledItems[index] = shuffledItems[randomIndex];
        shuffledItems[randomIndex] = currentItem;
    }

    return shuffledItems;
};

const buildPrepositionSequence = (
    rounds: number,
    selectedPrepositions: SpotOnPreposition[],
): SpotOnPreposition[] => {
    const usablePrepositions =
        selectedPrepositions.length > 0
            ? selectedPrepositions
            : [...SPOT_ON_PREPOSITIONS];

    const sequence: SpotOnPreposition[] = [];

    while (sequence.length < rounds) {
        sequence.push(...shuffleArray(usablePrepositions));
    }

    return sequence.slice(0, rounds);
};

export const generateSpotOnQuestions = (
    payload: SpotOnExercisePayload,
    selectedPrepositions: SpotOnPreposition[],
): SpotOnQuestion[] => {
    const prepositionSequence = buildPrepositionSequence(
        payload.rounds,
        selectedPrepositions,
    );

    return prepositionSequence.map((preposition, index) => {
        const character = pickRandom(payload.characters);
        // Filter objects by allowed IDs for this preposition
        const allowedObjectIds =
            payload.objectsByPreposition?.[preposition] || [];
        const allowedObjects = payload.objects.filter((obj) =>
            allowedObjectIds.includes(obj.id),
        );
        if (allowedObjects.length === 0) {
            throw new Error(
                `No allowed objects for preposition '${preposition}'. Check objectsByPreposition in exerciseData.json.`,
            );
        }
        const object = pickRandom(allowedObjects);

        // Pluralize object name for 'between' prompt
        let promptObjectName = object.name;
        if (preposition === "between") {
            promptObjectName = object.name.endsWith("s")
                ? object.name
                : object.name + "s";
        }
        return {
            id: `spoton-${index + 1}-${preposition.replace(/\s+/g, "-")}`,
            prompt: buildPrompt(character.name, preposition, promptObjectName),
            preposition,
            character,
            object,
        };
    });
};
