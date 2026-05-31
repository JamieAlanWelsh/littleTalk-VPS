/**
 * Task Master Exercise
 *
 * Orchestrates the exercise flow: setup screen → exercise display.
 * Manages setup parameters and delegates exercise display to the game component.
 */

import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import TaskMasterGame from "./TaskMasterGame";
import TaskMasterSettings from "./TaskMasterSettings";
import { generateQuestions } from "./utils";
import {
    TASK_MASTER_PREPOSITIONS,
    type TaskMasterOptions,
    type TaskMasterQuestion,
} from "./types";

const EXERCISE_METADATA = {
    setupTitle: "Task Master Setup",
    setupSubtitle: "What would you like to work on today?",
};

export interface TaskMasterPayload {
    tasks: {
        id: string;
        prompt: string;
        imageUrl: string;
        altText?: string;
    }[];
}

interface TaskMasterProps {
    onSettingsRequested?: () => void;
}

export const TaskMaster = ({ onSettingsRequested }: TaskMasterProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [questions, setQuestions] = useState<TaskMasterQuestion[]>([]);
    const [options, setOptions] = useState<TaskMasterOptions>({
        selectedPrepositions: [...TASK_MASTER_PREPOSITIONS],
    });

    const handleStartExercise = () => {
        setQuestions(generateQuestions(options));
        setHasStarted(true);
    };

    return !hasStarted ? (
        <ExerciseStartScreen
            title={EXERCISE_METADATA.setupTitle}
            subtitle={EXERCISE_METADATA.setupSubtitle}
            onStart={handleStartExercise}
            onTutorial={() => {
                // TODO: Implement tutorial
                console.log("Tutorial requested");
            }}
        >
            <TaskMasterSettings onSetOptions={setOptions} />
        </ExerciseStartScreen>
    ) : (
        <TaskMasterGame
            questions={questions}
            onSettingsRequested={() => {
                setHasStarted(false);
                onSettingsRequested?.();
            }}
        />
    );
};

export default TaskMaster;
