import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ExerciseEndscreen from "../../layouts/exerciseEndscreen/ExerciseEndscreen";
import ColourfulSemanticsSettingsScreen from "./ColourfulSemanticsSettingsScreen";
import ColourfulSemanticsGame from "./ColourfulSemanticsGame";
import { pickRandomScene } from "./configureScene";
import type {
    ColourfulSemanticsOptions,
    ColourfulSemanticsPayload,
    ColourfulSemanticsScene,
} from "./types";

const DEFAULT_OPTIONS: ColourfulSemanticsOptions = {
    presetId: "subject-verb-object-location",
    numberOfOptions: 5,
};

const TOTAL_REPETITIONS = 5;

interface ColourfulSemanticsExerciseProps {
    payload: ColourfulSemanticsPayload;
}

export const ColourfulSemanticsExercise = ({
    payload,
}: ColourfulSemanticsExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [options, setOptions] =
        useState<ColourfulSemanticsOptions>(DEFAULT_OPTIONS);
    const [selectedScene, setSelectedScene] =
        useState<ColourfulSemanticsScene | null>(null);
    const [repetitionCount, setRepetitionCount] = useState(0);
    const [skipToken, setSkipToken] = useState(0);

    const handleStart = () => {
        setRepetitionCount(0);
        setSelectedScene(pickRandomScene(payload.scenes, options.presetId));
        setHasStarted(true);
    };

    const handleSettingsRequested = () => {
        setSelectedScene(null);
        setRepetitionCount(0);
        setHasStarted(false);
    };

    const handleRoundComplete = () => {
        const nextRep = repetitionCount + 1;
        setRepetitionCount(nextRep);
        if (nextRep < TOTAL_REPETITIONS) {
            setSelectedScene(pickRandomScene(payload.scenes, options.presetId));
        }
    };

    const handleSkipTarget = () => {
        setSelectedScene(
            pickRandomScene(
                payload.scenes,
                options.presetId,
                selectedScene?.id,
            ),
        );
        setSkipToken((t) => t + 1);
    };

    const handleEndscreenReturn = () => {
        window.location.href = "/practise/";
    };

    if (!hasStarted) {
        return (
            <ExerciseStartScreen
                title="Colourful Semantics Setup"
                subtitle="What would you like to work on today?"
                onStart={handleStart}
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
        );
    }

    if (repetitionCount >= TOTAL_REPETITIONS) {
        return (
            <ExerciseEndscreen
                expGained={TOTAL_REPETITIONS * 10}
                onReturnHome={handleEndscreenReturn}
            />
        );
    }

    return (
        <ColourfulSemanticsGame
            key={`${repetitionCount}-${skipToken}`}
            onSettingsRequested={handleSettingsRequested}
            onRoundComplete={handleRoundComplete}
            onSkipRequested={handleSkipTarget}
            options={options}
            payload={payload}
            scene={selectedScene!}
            progressBase={repetitionCount / TOTAL_REPETITIONS}
            progressScale={1 / TOTAL_REPETITIONS}
        />
    );
};

export default ColourfulSemanticsExercise;
