import exerciseData from "./exerciseData.json";
import {
    TASK_MASTER_PREPOSITIONS,
    TaskMasterExerciseDataSchema,
    type TaskMasterOptions,
    type TaskMasterQuestion,
} from "./types";

const QUESTIONS_PER_ROUND = 5;

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

    const candidates = data.tasks.flatMap((task) =>
        task.questions
            .filter((question) =>
                selectedPrepositions.includes(question.preposition),
            )
            .map((question) => {
                const object = pickRandom(data.objects);

                return {
                    id: `${task.id}-${question.id}`,
                    prompt: `Put the ${object.label} ${question.question}.`,
                    character: task.altText ?? task.id,
                    answer: question.answer,
                    image: task.imageUrl,
                    objectUrl: object.imageUrl,
                    objectLabel: object.label,
                };
            }),
    );

    if (candidates.length === 0) {
        return [];
    }

    const randomizedCandidates = shuffleArray(candidates);
    const questions: TaskMasterQuestion[] = [];

    while (questions.length < QUESTIONS_PER_ROUND) {
        questions.push(...shuffleArray(randomizedCandidates));
    }

    return questions.slice(0, QUESTIONS_PER_ROUND);
};
