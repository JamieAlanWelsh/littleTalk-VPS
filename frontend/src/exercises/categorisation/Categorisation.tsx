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

/**
 * Select random items from an array
 */
const selectRandomItems = <T,>(items: T[], count: number): T[] => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

interface CategorisationExerciseProps {
    payload: CategorisationExercisePayload;
}

export const CategorisationExercise = ({
    payload,
}: CategorisationExerciseProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const categories = Object.keys(payload.categories);
    const [options, setOptions] = useState<CategorisationOptions>({
        selectedCategoryIds: categories.slice(0, 2),
        itemsPerCategory: 2,
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
        <CategorisationGame
            categories={Object.fromEntries(
                Object.entries(payload.categories)
                    .filter(([categoryId]) =>
                        options.selectedCategoryIds.includes(categoryId),
                    )
                    .map(([categoryId, items]) => [
                        categoryId,
                        selectRandomItems(items, options.itemsPerCategory),
                    ]),
            )}
        />
    );
};

export default CategorisationExercise;
