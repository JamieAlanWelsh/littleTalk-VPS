import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ColourfulSemanticsSettingsScreen from "./ColourfulSemanticsSettingsScreen";
import ColourfulSemanticsGame from "./ColourfulSemanticsGame";
import type {
    ColourfulSemanticsOptions,
    ColourfulSemanticsPayload,
} from "./types";

const DEFAULT_OPTIONS: ColourfulSemanticsOptions = {
    presetId: "subject-verb-object-location",
    numberOfOptions: 5,
};

interface ColourfulSemanticsExerciseProps {
    payload: ColourfulSemanticsPayload;
}

export const ColourfulSemanticsExercise = ({
    payload,
}: ColourfulSemanticsExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [options, setOptions] =
        useState<ColourfulSemanticsOptions>(DEFAULT_OPTIONS);

    return !hasStarted ? (
        <ExerciseStartScreen
            title="Colourful Semantics Setup"
            subtitle="What would you like to work on today?"
            onStart={() => setHasStarted(true)}
            onTutorial={() => {
                console.log("Tutorial requested");
            }}
        >
            <ColourfulSemanticsSettingsScreen
                options={options}
                payload={payload}
                onSetOptions={setOptions}
            />
        </ExerciseStartScreen>
    ) : (
        <ColourfulSemanticsGame
            onSettingsRequested={() => setHasStarted(false)}
            options={options}
            payload={payload}
        />
    );
};

export default ColourfulSemanticsExercise;
