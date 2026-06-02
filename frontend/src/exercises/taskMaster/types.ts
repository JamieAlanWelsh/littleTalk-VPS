import { z } from "zod";
import { TASK_MASTER_QUESTIONS_PER_SCENE } from "./constants";

export const TaskMasterTaskQuestionDataSchema = z.object({
    id: z.string(),
    question: z.string(),
    answer: z.array(z.tuple([z.number().int(), z.number().int()])).min(1),
});

export type TaskMasterTaskQuestionData = z.infer<
    typeof TaskMasterTaskQuestionDataSchema
>;

export const TaskMasterTaskDataSchema = z.object({
    id: z.string(),
    imageUrl: z
        .string()
        .regex(/^\/static\/exercise_assets\/task_master\/.+\.webp$/i),
    altText: z.string().optional(),
    questions: z
        .array(TaskMasterTaskQuestionDataSchema)
        .length(TASK_MASTER_QUESTIONS_PER_SCENE),
});

export type TaskMasterTaskData = z.infer<typeof TaskMasterTaskDataSchema>;

export const TaskMasterObjectDataSchema = z.object({
    id: z.string(),
    label: z.string(),
    imageUrl: z.string().regex(/^\/static\/exercise_assets\/characters\/.+/i),
});

export type TaskMasterObjectData = z.infer<typeof TaskMasterObjectDataSchema>;

export const TaskMasterExerciseDataSchema = z.object({
    tasks: z.array(TaskMasterTaskDataSchema),
    objects: z.array(TaskMasterObjectDataSchema).min(1),
});

export type TaskMasterExerciseData = z.infer<
    typeof TaskMasterExerciseDataSchema
>;

export interface TaskMasterQuestion {
    id: string;
    prompt: string;
    character: string;
    answer: number[][];
    image: string;
    objectUrl: string;
    objectLabel: string;
}
