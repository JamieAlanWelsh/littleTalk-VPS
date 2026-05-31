import { z } from "zod";
import {
    PREPOSITIONS,
    prepositionsSchema,
    type SpotOnPreposition,
} from "../../types";

export const TASK_MASTER_PREPOSITIONS = PREPOSITIONS;

export type TaskMasterPreposition = SpotOnPreposition;

export interface TaskMasterOptions {
    selectedPrepositions: TaskMasterPreposition[];
}

export const TaskMasterTaskQuestionDataSchema = z.object({
    id: z.string(),
    preposition: prepositionsSchema,
    question: z.string(),
    answer: z.array(z.tuple([z.number().int(), z.number().int()])),
});

export type TaskMasterTaskQuestionData = z.infer<
    typeof TaskMasterTaskQuestionDataSchema
>;

export const TaskMasterTaskDataSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    altText: z.string().optional(),
    questions: z.array(TaskMasterTaskQuestionDataSchema),
});

export type TaskMasterTaskData = z.infer<typeof TaskMasterTaskDataSchema>;

export const TaskMasterObjectDataSchema = z.object({
    id: z.string(),
    label: z.string(),
    imageUrl: z.string(),
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
