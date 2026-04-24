/**
 * Categorisation Exercise Settings Screen
 *
 * Options selection zone for the Categorisation exercise.
 * Allows users to select which categories to include.
 */

import { useState, useEffect } from "react";
import type {
    CategorisationExercisePayload,
    CategorisationOptions,
} from "./types";
import Button from "../../components/Button/Button";
import styles from "../../layouts/exerciseStartScreen/ExerciseStartScreen.module.css";

interface CategorisationSettingsScreenProps {
    payload: CategorisationExercisePayload;
    onSetOptions: (options: CategorisationOptions) => void;
}

const formatCategoryLabel = (categoryId: string) =>
    categoryId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export const CategorisationSettingsScreen = ({
    payload,
    onSetOptions,
}: CategorisationSettingsScreenProps) => {
    const availableCategoryIds = Object.keys(payload.categories);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
        () => availableCategoryIds.slice(0, 2),
    );

    useEffect(() => {
        onSetOptions({ selectedCategoryIds });
    }, [selectedCategoryIds, onSetOptions]);

    const toggleCategory = (categoryId: string) => {
        setSelectedCategoryIds((currentCategoryIds) =>
            currentCategoryIds.includes(categoryId)
                ? currentCategoryIds.filter(
                      (currentId) => currentId !== categoryId,
                  )
                : [...currentCategoryIds, categoryId],
        );
    };

    return (
        <>
            <h3 className={styles.sectionTitle}>Choose categories:</h3>
            <div className={styles.optionsList}>
                {availableCategoryIds.map((categoryId) => (
                    <Button
                        key={categoryId}
                        variant={
                            selectedCategoryIds.includes(categoryId)
                                ? "primary"
                                : "secondary"
                        }
                        onClick={() => toggleCategory(categoryId)}
                        width={"100%"}
                        label={formatCategoryLabel(categoryId)}
                    />
                ))}
            </div>
        </>
    );
};

export default CategorisationSettingsScreen;
