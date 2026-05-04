import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ColourfulSemanticsSettingsScreen from "./ColourfulSemanticsSettingsScreen";
import ColourfulSemanticsGame from "./ColourfulSemanticsGame";
import { configureScene, pickRandomScene } from "./configureScene";
import { buildSceneQuestions } from "./buildSceneQuestions";
import type {
    ColourfulSemanticsOption,
    ColourfulSemanticsOptions,
    ColourfulSemanticsPayload,
} from "./types";
import type { SceneQuestions } from "./buildSceneQuestions";

const DEFAULT_OPTIONS: ColourfulSemanticsOptions = {
    presetId: "subject-verb-object-location",
    numberOfOptions: 5,
};

const TOTAL_REPETITIONS = 5;

const buildItemsById = (
    payload: ColourfulSemanticsPayload,
): Record<string, ColourfulSemanticsOption> =>
    Object.fromEntries(
        [payload.who, payload.doing, payload.what, payload.where]
            .flat()
            .map((item) => [item.id, item]),
    );

interface ColourfulSemanticsExerciseProps {
    payload: ColourfulSemanticsPayload;
}

export const ColourfulSemanticsExercise = ({
    payload,
}: ColourfulSemanticsExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [options, setOptions] =
        useState<ColourfulSemanticsOptions>(DEFAULT_OPTIONS);
    const [sceneQuestionsList, setSceneQuestionsList] = useState<
        SceneQuestions[] | null
    >(null);

    const handleStart = () => {
        const itemsById = buildItemsById(payload);
        const picked: SceneQuestions[] = [];
        for (let i = 0; i < TOTAL_REPETITIONS; i++) {
            const prevId = picked[i - 1]?.sceneId;
            const raw = pickRandomScene(
                payload.scenes,
                options.presetId,
                prevId,
            );
            const configured = configureScene({ scene: raw, options });
            picked.push(buildSceneQuestions(configured, itemsById));
        }
        setSceneQuestionsList(picked);
        setHasStarted(true);
    };

    const handleSettingsRequested = () => {
        setHasStarted(false);
        setSceneQuestionsList(null);
    };

    return !hasStarted || !sceneQuestionsList ? (
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
    ) : (
        <ColourfulSemanticsGame
            onSettingsRequested={handleSettingsRequested}
            sceneQuestionsList={sceneQuestionsList}
            payload={payload}
        />
    );
};

export default ColourfulSemanticsExercise;
