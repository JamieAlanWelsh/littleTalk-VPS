import { useEffect, useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ExerciseEndscreen from "../../layouts/exerciseEndscreen/ExerciseEndscreen";
import ColourfulSemanticsSettingsScreen from "./ColourfulSemanticsSettingsScreen";
import ColourfulSemanticsGame from "./ColourfulSemanticsGame";
import {
    getDefaultOptionsForVariant,
    pickRandomScene,
    sanitizeOptionsForVariant,
} from "./configureScene";
import type {
    ColourfulSemanticsOptions,
    ColourfulSemanticsPayload,
    ColourfulSemanticsScene,
    ColourfulSemanticsVariantConfig,
} from "./types";

const TOTAL_REPETITIONS = 5;

interface ColourfulSemanticsExerciseProps {
    payload: ColourfulSemanticsPayload;
    variant: ColourfulSemanticsVariantConfig;
}

export const ColourfulSemanticsExercise = ({
    payload,
    variant,
}: ColourfulSemanticsExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [options, setOptions] = useState<ColourfulSemanticsOptions>(() =>
        sanitizeOptionsForVariant({
            options: getDefaultOptionsForVariant(variant),
            scenes: payload.scenes,
            variant,
        }),
    );
    const [selectedScene, setSelectedScene] =
        useState<ColourfulSemanticsScene | null>(null);
    const [repetitionCount, setRepetitionCount] = useState(0);
    const [skipToken, setSkipToken] = useState(0);
    const [usedSceneIds, setUsedSceneIds] = useState<string[]>([]);

    useEffect(() => {
        setOptions((currentOptions) => {
            const nextOptions = sanitizeOptionsForVariant({
                options: currentOptions,
                scenes: payload.scenes,
                variant,
            });

            const hasSameOptionalSlots =
                currentOptions.enabledOptionalSlotIds.length ===
                    nextOptions.enabledOptionalSlotIds.length &&
                currentOptions.enabledOptionalSlotIds.every(
                    (slotId, index) =>
                        slotId === nextOptions.enabledOptionalSlotIds[index],
                );

            return currentOptions.presetId === nextOptions.presetId &&
                currentOptions.numberOfOptions ===
                    nextOptions.numberOfOptions &&
                hasSameOptionalSlots
                ? currentOptions
                : nextOptions;
        });
    }, [payload.scenes, variant]);

    const handleStart = () => {
        setRepetitionCount(0);
        setUsedSceneIds([]);
        setSelectedScene(pickRandomScene(payload.scenes, options, variant));
        setHasStarted(true);
    };

    const handleSettingsRequested = () => {
        setSelectedScene(null);
        setRepetitionCount(0);
        setUsedSceneIds([]);
        setHasStarted(false);
    };

    const handleRoundComplete = () => {
        const nextRep = repetitionCount + 1;
        const nextUsedSceneIds = selectedScene
            ? [...usedSceneIds, selectedScene.id]
            : usedSceneIds;
        setUsedSceneIds(nextUsedSceneIds);
        setRepetitionCount(nextRep);
        if (nextRep < TOTAL_REPETITIONS) {
            setSelectedScene(
                pickRandomScene(
                    payload.scenes,
                    options,
                    variant,
                    nextUsedSceneIds,
                ),
            );
        }
    };

    const handleSkipTarget = () => {
        const excludeIds = selectedScene
            ? [...usedSceneIds, selectedScene.id]
            : usedSceneIds;
        setSelectedScene(
            pickRandomScene(payload.scenes, options, variant, excludeIds),
        );
        setSkipToken((t) => t + 1);
    };

    const handleEndscreenReturn = () => {
        window.location.href = "/practise/";
    };

    if (!hasStarted) {
        return (
            <ExerciseStartScreen
                title={
                    variant.id === "early-years"
                        ? "Colourful Semantics Early Years Setup"
                        : variant.id === "advanced"
                          ? "Colourful Semantics Advanced Setup"
                          : "Colourful Semantics Setup"
                }
                subtitle="What would you like to work on today?"
                onStart={handleStart}
                onTutorial={() => {
                    console.log("Tutorial requested");
                }}
            >
                <ColourfulSemanticsSettingsScreen
                    options={options}
                    payload={payload}
                    variant={variant}
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
            variant={variant}
            progressBase={repetitionCount / TOTAL_REPETITIONS}
            progressScale={1 / TOTAL_REPETITIONS}
        />
    );
};

export default ColourfulSemanticsExercise;
