import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ColourfulSemanticsGame from "./ColourfulSemanticsGame";
import type { ColourfulSemanticsPayload } from "./types";

interface ColourfulSemanticsExerciseProps {
    payload: ColourfulSemanticsPayload;
}

export const ColourfulSemanticsExercise = ({
    payload,
}: ColourfulSemanticsExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const scene = payload.scenes[0];

    return !hasStarted ? (
        <ExerciseStartScreen
            title="Colourful Semantics"
            subtitle={scene.title}
            startButtonLabel="Start"
            onStart={() => setHasStarted(true)}
            onTutorial={() => {
                console.log("Tutorial requested");
            }}
        >
            <p>
                Start with: {scene.steps[0].prompt} Drag the best word into the
                highlighted block, then press Check to move to the next part of
                the sentence.
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
