import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import StoryTrainGame from "./StoryTrainGame";
import type { StoryTrainExercisePayload, StoryTrainSet } from "./types";

const EXERCISE_METADATA = {
    setupTitle: "Story Train",
    setupSubtitle: "Put each picture story in the order it happens.",
};

interface StoryTrainProps {
    payload: StoryTrainExercisePayload;
}

const shuffleSets = (sets: StoryTrainSet[]): StoryTrainSet[] => {
    const shuffled = [...sets];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [
            shuffled[swapIndex],
            shuffled[index],
        ];
    }

    return shuffled;
};

export const StoryTrain = ({ payload }: StoryTrainProps) => {
    const [selectedSets, setSelectedSets] = useState<StoryTrainSet[] | null>(
        null,
    );

    const handleStartExercise = () => {
        const roundsToPlay = Math.min(payload.rounds, payload.sets.length);
        setSelectedSets(shuffleSets(payload.sets).slice(0, roundsToPlay));
    };

    if (!selectedSets) {
        return (
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
                        Look at the three pictures and drag them into the order
                        they happen.
                    </p>
                    <p style={{ margin: 0 }}>
                        Use the time words first, next, and then to talk through
                        each story.
                    </p>
                    {payload.modellingTip ? (
                        <p style={{ margin: 0, fontWeight: 700 }}>
                            {payload.modellingTip}
                        </p>
                    ) : null}
                </div>
            </ExerciseStartScreen>
        );
    }

    return <StoryTrainGame selectedSets={selectedSets} />;
};

export default StoryTrain;
