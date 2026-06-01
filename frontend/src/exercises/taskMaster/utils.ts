import exerciseData from "./exerciseData.json";
import {
    TASK_MASTER_PREPOSITIONS,
    TaskMasterExerciseDataSchema,
    type TaskMasterTaskData,
    type TaskMasterOptions,
    type TaskMasterQuestion,
} from "./types";

const SCENES_PER_EXERCISE = 2;
const MAX_OBJECTS_PER_SCENE = 5;

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

const pickRandom = <T>(items: readonly T[]): T =>
    items[Math.floor(Math.random() * items.length)];

const buildQuestionsForScene = (
    scene: TaskMasterTaskData,
    selectedPrepositions: readonly string[],
    allObjects: ReadonlyArray<{ label: string; imageUrl: string }>,
): TaskMasterQuestion[] => {
    const filteredQuestions = scene.questions.filter((question) =>
        selectedPrepositions.includes(question.preposition),
    );

    if (filteredQuestions.length === 0) {
        return [];
    }

    const objectCount = Math.min(
        MAX_OBJECTS_PER_SCENE,
        filteredQuestions.length,
    );
    const sceneObjects = shuffleArray([...allObjects]).slice(0, objectCount);
    const shuffledQuestions = shuffleArray(filteredQuestions);

    return shuffledQuestions.map((question, index) => {
        const object =
            sceneObjects[index % sceneObjects.length] ?? pickRandom(allObjects);

        return {
            id: `${scene.id}-${question.id}`,
            prompt: `Put the ${object.label} ${question.question}.`,
            character: scene.altText ?? scene.id,
            answer: question.answer,
            image: scene.imageUrl,
            objectUrl: object.imageUrl,
            objectLabel: object.label,
        };
    });
};

export const generateQuestions = (
    options: TaskMasterOptions,
): TaskMasterQuestion[] => {
    const parseResult = TaskMasterExerciseDataSchema.safeParse(exerciseData);

    if (!parseResult.success) {
        console.error(
            "Invalid Task Master exercise data:",
            parseResult.error.format(),
        );
        return [];
    }

    const data = parseResult.data;
    const selectedPrepositions =
        options.selectedPrepositions.length > 0
            ? options.selectedPrepositions
            : [...TASK_MASTER_PREPOSITIONS];

    const scenesWithMatchingQuestions = data.tasks.filter((scene) =>
        scene.questions.some((question) =>
            selectedPrepositions.includes(question.preposition),
        ),
    );

    if (scenesWithMatchingQuestions.length === 0) {
        return [];
    }

    const selectedScenes = shuffleArray(scenesWithMatchingQuestions).slice(
        0,
        SCENES_PER_EXERCISE,
    );

    // Keep scene order stable: all questions from scene X, then scene Y.
    return selectedScenes.flatMap((scene) =>
        buildQuestionsForScene(scene, selectedPrepositions, data.objects),
    );
};
