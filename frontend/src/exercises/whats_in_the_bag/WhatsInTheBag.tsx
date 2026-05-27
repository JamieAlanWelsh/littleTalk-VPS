import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import type { WhatsInTheBagOptions, WhatsInTheBagPayload } from "./types";
import WhatsInTheBagGame from "./WhatsInTheBagGame";
import WhatsInTheBagSettingsScreen from "./WhatsInTheBagSettingsScreen";

const EXERCISE_METADATA = {
    setupTitle: "What's In The Bag Setup",
    setupSubtitle: "Choose how many word options to show each round.",
};

interface WhatsInTheBagExerciseProps {
    payload: WhatsInTheBagPayload;
}

export const WhatsInTheBagExercise = ({
    payload,
}: WhatsInTheBagExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [options, setOptions] = useState<WhatsInTheBagOptions>({
        numberOfOptions: 3,
    });

    const handleStartExercise = () => {
        setHasStarted(true);
    };

    return !hasStarted ? (
        <ExerciseStartScreen
            title={EXERCISE_METADATA.setupTitle}
            subtitle={EXERCISE_METADATA.setupSubtitle}
            onStart={handleStartExercise}
            onTutorial={() => {
                console.log("Tutorial requested");
            }}
        >
            <WhatsInTheBagSettingsScreen onSetOptions={setOptions} />
        </ExerciseStartScreen>
    ) : (
        <WhatsInTheBagGame
            payload={payload}
            options={options}
            onSettingsRequested={() => setHasStarted(false)}
        />
    );
};

export default WhatsInTheBagExercise;
