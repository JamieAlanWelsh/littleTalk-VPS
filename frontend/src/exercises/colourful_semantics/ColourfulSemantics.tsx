import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ColourfulSemanticsGame from "./ColourfulSemanticsGame";
import type { ColourfulSemanticsPayload } from "./types";

interface ColourfulSemanticsExerciseProps {
    payload: ColourfulSemanticsPayload;
}

const EXERCISE_METADATA = {
    setupTitle: "Colourful Semantics",
    setupSubtitle: "Build a sentence one block at a time to match the picture.",
};

export const ColourfulSemanticsExercise = ({
    payload,
}: ColourfulSemanticsExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);

    return !hasStarted ? (
        <ExerciseStartScreen
            title={EXERCISE_METADATA.setupTitle}
            subtitle={EXERCISE_METADATA.setupSubtitle}
            onStart={() => setHasStarted(true)}
            onTutorial={() => {
                console.log("Tutorial requested");
            }}
        >
            <p>
                Drag the best word into the highlighted block, then press Check
                to move to the next part of the sentence.
            </p>
        </ExerciseStartScreen>
    ) : (
        <ColourfulSemanticsGame
            onSettingsRequested={() => setHasStarted(false)}
            payload={payload}
        />
    );
};

export default ColourfulSemanticsExercise;
