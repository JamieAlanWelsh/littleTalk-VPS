/**
 * Task Master Exercise
 *
 * Orchestrates the exercise flow: setup screen → exercise display.
 * Manages setup parameters and delegates exercise display to the game component.
 */

import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import TaskMasterGame from "./TaskMasterGame";
import { useGroupContextValue } from "../../contexts/GroupContext";
import { generateQuestions } from "./utils";
import type { TaskMasterQuestion } from "./types";
import { TASK_MASTER_QUESTIONS_PER_SCENE } from "./constants";

const EXERCISE_METADATA = {
    setupTitle: "Task Master Setup",
    setupSubtitle:
        "Follow the multi-step instructions and place each character in the scene one by one.",
};

export interface TaskMasterPayload {
    tasks: {
        id: string;
        prompt: string;
        imageUrl: string;
        altText?: string;
    }[];
}

export const TaskMaster = () => {
    const { groupLearners, isGroupMode } = useGroupContextValue();
    const [hasStarted, setHasStarted] = useState(false);
    const [questions, setQuestions] = useState<TaskMasterQuestion[]>([]);
    const requestedQuestionCount = isGroupMode
        ? Math.max(TASK_MASTER_QUESTIONS_PER_SCENE, groupLearners.length * 2)
        : TASK_MASTER_QUESTIONS_PER_SCENE;

    const handleStartExercise = () => {
        setQuestions(generateQuestions(requestedQuestionCount));
        setHasStarted(true);
    };

    return !hasStarted ? (
        <ExerciseStartScreen
            title={EXERCISE_METADATA.setupTitle}
            subtitle={EXERCISE_METADATA.setupSubtitle}
            onStart={handleStartExercise}
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
                    You will complete {requestedQuestionCount} instructions in
                    one scene.
                </p>
                <p style={{ margin: 0 }}>
                    Drag the character into the best matching box for each
                    prompt.
                </p>
                <p style={{ margin: 0, fontWeight: 700 }}>
                    Modelling Tip: Use contextual clues to help break down
                    instructions. For example: Which tree is the closest to the
                    path?
                </p>
            </div>
        </ExerciseStartScreen>
    ) : (
        <TaskMasterGame questions={questions} />
    );
};

export default TaskMaster;
