/**
 * Concept Quest Exercise
 *
 * Orchestrates the setup screen and gameplay view.
 */

import { useState } from "react";
import type { ConceptQuestOptions, ConceptQuestPayload } from "../../lib/types";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ConceptQuestGame from "./ConceptQuestGame";
import ConceptQuestSettingsScreen from "./ConceptQuestSettingsScreen";

const EXERCISE_METADATA = {
    setupTitle: "Concept Quest Setup",
    setupSubtitle: "Choose which concepts and complexity level to practise.",
};

const DEFAULT_OPTIONS: ConceptQuestOptions = {
    concepts: ["big", "small", "short", "long", "tall"],
    complexities: [1],
};

interface ConceptQuestExerciseProps {
    payload: ConceptQuestPayload;
}

export const ConceptQuestExercise = ({
    payload,
}: ConceptQuestExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [options, setOptions] =
        useState<ConceptQuestOptions>(DEFAULT_OPTIONS);

    return !hasStarted ? (
        <ExerciseStartScreen
            title={EXERCISE_METADATA.setupTitle}
            subtitle={EXERCISE_METADATA.setupSubtitle}
            onStart={() => setHasStarted(true)}
            onTutorial={() => {
                console.log("Tutorial requested");
            }}
        >
            <ConceptQuestSettingsScreen onSetOptions={setOptions} />
        </ExerciseStartScreen>
    ) : (
        <ConceptQuestGame
            payload={payload}
            options={options}
            onSettingsRequested={() => setHasStarted(false)}
        />
    );
};

export default ConceptQuestExercise;
