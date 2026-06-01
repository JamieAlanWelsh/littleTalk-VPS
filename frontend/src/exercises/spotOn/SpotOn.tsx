import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import SpotOnGame from "./SpotOnGame";
import SpotOnSettings from "./SpotOnSettings";
import { generateSpotOnQuestions } from "./generateQuestions";
import {
    SPOT_ON_PREPOSITIONS,
    type SpotOnExercisePayload,
    type SpotOnOptions,
    type SpotOnQuestion,
} from "./types";

const EXERCISE_METADATA = {
    setupTitle: "Spot On!",
    setupSubtitle: "Drag the character into the correct position.",
};

interface SpotOnProps {
    payload: SpotOnExercisePayload;
}

export const SpotOn = ({ payload }: SpotOnProps) => {
    const [options, setOptions] = useState<SpotOnOptions>({
        selectedPrepositions: [...SPOT_ON_PREPOSITIONS],
    });
    const [questions, setQuestions] = useState<SpotOnQuestion[] | null>(null);

    const handleStartExercise = () => {
        setQuestions(
            generateSpotOnQuestions(payload, options.selectedPrepositions),
        );
    };

    if (!questions) {
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
                    <p style={{ margin: 0 }}>{payload.instruction}</p>
                    {payload.modellingTip ? (
                        <p style={{ margin: 0, fontWeight: 700 }}>
                            {payload.modellingTip}
                        </p>
                    ) : null}
                    <SpotOnSettings onSetOptions={setOptions} />
                </div>
            </ExerciseStartScreen>
        );
    }

    return (
        <SpotOnGame
            questions={questions}
            onSettingsRequested={() => setQuestions(null)}
        />
    );
};

export default SpotOn;
