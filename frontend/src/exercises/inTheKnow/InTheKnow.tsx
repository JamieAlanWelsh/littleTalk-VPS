import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import InTheKnowGame from "./InTheKnowGame";
import InTheKnowSettingsScreen from "./InTheKnowSettingsScreen";
import type { InTheKnowChoiceCount, InTheKnowPayload } from "./types";

const EXERCISE_METADATA = {
    setupTitle: "In The Know",
    setupSubtitle: "Look at the picture and choose the best answer.",
};

interface InTheKnowProps {
    payload: InTheKnowPayload;
}

export const InTheKnow = ({ payload }: InTheKnowProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [choiceCount, setChoiceCount] = useState<InTheKnowChoiceCount>(3);

    if (!hasStarted) {
        return (
            <ExerciseStartScreen
                title={EXERCISE_METADATA.setupTitle}
                subtitle={EXERCISE_METADATA.setupSubtitle}
                onStart={() => setHasStarted(true)}
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
                        Read the question and look at the picture clues.
                    </p>
                    <p style={{ margin: 0 }}>
                        Pick one option, then press Check.
                    </p>
                    <InTheKnowSettingsScreen
                        choiceCount={choiceCount}
                        onSetChoiceCount={setChoiceCount}
                    />
                </div>
            </ExerciseStartScreen>
        );
    }

    return (
        <InTheKnowGame
            payload={payload}
            choiceCount={choiceCount}
            onSettingsRequested={() => setHasStarted(false)}
        />
    );
};

export default InTheKnow;
