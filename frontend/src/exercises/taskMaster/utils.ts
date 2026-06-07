import exerciseData from "./exerciseData.json";
import { TASK_MASTER_MAX_OBJECTS_PER_SCENE } from "./constants";
import {
    TaskMasterExerciseDataSchema,
    type TaskMasterTaskData,
    type TaskMasterQuestion,
} from "./types";

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
    allObjects: ReadonlyArray<{ label: string; imageUrl: string }>,
): TaskMasterQuestion[] => {
    const objectCount = Math.min(
        TASK_MASTER_MAX_OBJECTS_PER_SCENE,
        scene.questions.length,
    );
    const sceneObjects = shuffleArray([...allObjects]).slice(0, objectCount);
    const shuffledQuestions = shuffleArray(scene.questions);

    return shuffledQuestions.map((question, index) => {
        const object =
            sceneObjects[index % sceneObjects.length] ?? pickRandom(allObjects);

        return {
            id: `${scene.id}-${question.id}`,
            prompt: `Put ${object.label} ${question.question}.`,
            character: scene.altText ?? scene.id,
            answer: question.answer,
            image: scene.imageUrl,
            objectUrl: object.imageUrl,
            objectLabel: object.label,
        };
    });
};

export const generateQuestions = (): TaskMasterQuestion[] => {
    const parseResult = TaskMasterExerciseDataSchema.safeParse(exerciseData);

    if (!parseResult.success) {
        console.error(
            "Invalid Task Master exercise data:",
            parseResult.error.format(),
        );
        return [];
    }

    const data = parseResult.data;

    if (data.tasks.length === 0) {
        return [];
    }

    const [selectedScene] = shuffleArray(data.tasks);

    if (!selectedScene) {
        return [];
    }

    return buildQuestionsForScene(selectedScene, data.objects);
};
