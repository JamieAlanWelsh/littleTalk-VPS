/**
 * Task Master Exercise
 *
 * Orchestrates the exercise flow: setup screen → exercise display.
 * Manages setup parameters and delegates exercise display to the game component.
 */

import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import TaskMasterGame from "./TaskMasterGame";
import { generateQuestions } from "./utils";
import type { TaskMasterQuestion } from "./types";

const EXERCISE_METADATA = {
    setupTitle: "Task Master Setup",
    setupSubtitle:
        "Follow the instructions and place each character in the scene.",
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

    const handleStartExercise = () => {
        setQuestions(generateQuestions());
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
            startButtonLabel="Start"
        >
            <div
                style={{
                    display: "grid",
                    gap: "0.75rem",
                    color: "var(--font-color)",
                }}
            >
                <p style={{ margin: 0 }}>
                    You will complete 5 instructions in one scene.
                </p>
                <p style={{ margin: 0 }}>
                    Drag the character into the best matching box for each
                    prompt.
                </p>
                <p style={{ margin: 0, fontWeight: 700 }}>
                    Tip: move a character back to the tray if you want to change
                    your answer.
                </p>
            </div>
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
