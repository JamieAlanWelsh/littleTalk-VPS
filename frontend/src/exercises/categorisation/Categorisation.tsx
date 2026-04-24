/**
 * Categorisation Exercise
 *
 * Orchestrates the exercise flow: setup screen → exercise display.
 * Manages setup parameters and delegates exercise display to CategorisationGame.
 */

import { useState } from "react";
import type {
    CategorisationExercisePayload,
    CategorisationOptions,
} from "./types";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import CategorisationSettingsScreen from "./CategorisationSettingsScreen";
import CategorisationGame from "./CategorisationGame";

const EXERCISE_METADATA = {
    setupTitle: "Categorisation Setup",
    setupSubtitle: "Get ready to group items into categories",
};

interface CategorisationExerciseProps {
    payload: CategorisationExercisePayload;
}

export const CategorisationExercise = ({
    payload,
}: CategorisationExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const availableCategoryIds = Object.keys(payload.categories);
    const [options, setOptions] = useState<CategorisationOptions>({
        selectedCategoryIds: availableCategoryIds.slice(0, 2),
    });

    const handleStartExercise = () => {
        setHasStarted(true);
    };

    // Show setup screen until exercise is started
    return !hasStarted ? (
        <ExerciseStartScreen
            title={EXERCISE_METADATA.setupTitle}
            subtitle={EXERCISE_METADATA.setupSubtitle}
            onStart={handleStartExercise}
            onTutorial={() => {
                // TODO: Implement tutorial modal or navigation
                console.log("Tutorial requested");
            }}
        >
            <CategorisationSettingsScreen
                payload={payload}
                onSetOptions={setOptions}
            />
        </ExerciseStartScreen>
    ) : (
        <CategorisationGame payload={payload} options={options} />
    );
};

export default CategorisationExercise;
