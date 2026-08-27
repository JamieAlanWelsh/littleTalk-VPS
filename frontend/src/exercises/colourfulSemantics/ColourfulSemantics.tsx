import { useEffect, useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ExerciseEndscreen from "../../layouts/exerciseEndscreen/ExerciseEndscreen";
import ColourfulSemanticsSettingsScreen from "./ColourfulSemanticsSettingsScreen";
import ColourfulSemanticsGame from "./ColourfulSemanticsGame";
import { useGroupContextValue } from "../../contexts/GroupContext";
import {
    getDefaultOptionsForVariant,
    pickRandomScene,
    sanitizeOptionsForVariant,
} from "./configureScene";
import type {
    ColourfulSemanticsOptions,
    ColourfulSemanticsPayload,
    ColourfulSemanticsRoundStats,
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
    const { groupLearners, isGroupMode } = useGroupContextValue();
    const [hasStarted, setHasStarted] = useState(false);
    const [options, setOptions] = useState<ColourfulSemanticsOptions>(() =>
        sanitizeOptionsForVariant({
            options: getDefaultOptionsForVariant(variant),
            payload,
            scenes: payload.scenes,
            variant,
        }),
    );
    const [selectedScene, setSelectedScene] =
        useState<ColourfulSemanticsScene | null>(null);
    const [repetitionCount, setRepetitionCount] = useState(0);
    const [skipToken, setSkipToken] = useState(0);
    const [usedSceneIds, setUsedSceneIds] = useState<string[]>([]);
    const [sessionStartedAt, setSessionStartedAt] = useState<string>("");
    const [cumulativeRoundStats, setCumulativeRoundStats] =
        useState<ColourfulSemanticsRoundStats>({
            totalQuestions: 0,
            incorrectAnswers: 0,
            attemptsPerQuestion: [],
        });
    const totalRepetitions = isGroupMode
        ? Math.max(TOTAL_REPETITIONS, groupLearners.length * 2)
        : TOTAL_REPETITIONS;

    useEffect(() => {
        setOptions((currentOptions) => {
            const nextOptions = sanitizeOptionsForVariant({
                options: currentOptions,
                payload,
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
        setSessionStartedAt(new Date().toISOString());
        setCumulativeRoundStats({
            totalQuestions: 0,
            incorrectAnswers: 0,
            attemptsPerQuestion: [],
        });
        setSelectedScene(pickRandomScene(payload.scenes, options, variant));
        setHasStarted(true);
    };

    const handleSettingsRequested = () => {
        setSelectedScene(null);
        setRepetitionCount(0);
        setUsedSceneIds([]);
        setSessionStartedAt("");
        setCumulativeRoundStats({
            totalQuestions: 0,
            incorrectAnswers: 0,
            attemptsPerQuestion: [],
        });
        setHasStarted(false);
    };

    const handleRoundComplete = (roundStats: ColourfulSemanticsRoundStats) => {
        const nextRep = repetitionCount + 1;
        const nextUsedSceneIds = selectedScene
            ? [...usedSceneIds, selectedScene.id]
            : usedSceneIds;

        setCumulativeRoundStats((current) => ({
            totalQuestions: current.totalQuestions + roundStats.totalQuestions,
            incorrectAnswers:
                current.incorrectAnswers + roundStats.incorrectAnswers,
            attemptsPerQuestion: [
                ...current.attemptsPerQuestion,
                ...roundStats.attemptsPerQuestion,
            ],
        }));

        setUsedSceneIds(nextUsedSceneIds);
        setRepetitionCount(nextRep);
        if (nextRep < totalRepetitions) {
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

    if (repetitionCount >= totalRepetitions) {
        return (
            <ExerciseEndscreen
                expGained={totalRepetitions * 10}
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
            isFinalRepetition={repetitionCount + 1 >= totalRepetitions}
            sessionStartedAt={sessionStartedAt}
            cumulativeRoundStats={cumulativeRoundStats}
            progressBase={repetitionCount / totalRepetitions}
            progressScale={1 / totalRepetitions}
        />
    );
};

export default ColourfulSemanticsExercise;
