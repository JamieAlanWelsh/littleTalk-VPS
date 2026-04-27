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
import settingsStyles from "./CategorisationSettingsScreen.module.css";

const MAX_SELECTED_CATEGORIES = 4;
const DEFAULT_SELECTED_CATEGORY_COUNT = 2;
const DEFAULT_ITEMS_PER_CATEGORY = 2;

interface CategorisationSettingsScreenProps {
    payload: CategorisationExercisePayload;
    onSetOptions: (options: CategorisationOptions) => void;
}

const formatCategoryLabel = (categoryId: string) =>
    categoryId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const getMaxItemsPerCategory = (
    categoryIds: string[],
    categories: CategorisationExercisePayload["categories"],
) => {
    if (categoryIds.length === 0) {
        return 0;
    }

    return Math.min(
        ...categoryIds.map((categoryId) => categories[categoryId].length),
    );
};

export const CategorisationSettingsScreen = ({
    payload,
    onSetOptions,
}: CategorisationSettingsScreenProps) => {
    const availableCategoryIds = Object.keys(payload.categories);
    const initialSelectedCategoryIds = availableCategoryIds.slice(
        0,
        DEFAULT_SELECTED_CATEGORY_COUNT,
    );
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
        () => initialSelectedCategoryIds,
    );
    const [itemsPerCategory, setItemsPerCategory] = useState<number>(() =>
        Math.max(
            1,
            Math.min(
                DEFAULT_ITEMS_PER_CATEGORY,
                getMaxItemsPerCategory(
                    initialSelectedCategoryIds,
                    payload.categories,
                ),
            ),
        ),
    );

    const maxItemsPerCategory = getMaxItemsPerCategory(
        selectedCategoryIds,
        payload.categories,
    );

    useEffect(() => {
        if (maxItemsPerCategory === 0) {
            return;
        }

        setItemsPerCategory((currentItemsPerCategory) =>
            Math.min(currentItemsPerCategory, maxItemsPerCategory),
        );
    }, [maxItemsPerCategory]);

    useEffect(() => {
        if (maxItemsPerCategory === 0) {
            return;
        }

        onSetOptions({ selectedCategoryIds, itemsPerCategory });
    }, [
        selectedCategoryIds,
        itemsPerCategory,
        maxItemsPerCategory,
        onSetOptions,
    ]);

    const toggleCategory = (categoryId: string) => {
        setSelectedCategoryIds((currentCategoryIds) =>
            currentCategoryIds.includes(categoryId)
                ? currentCategoryIds.filter(
                      (currentId) => currentId !== categoryId,
                  )
                : currentCategoryIds.length >= MAX_SELECTED_CATEGORIES
                  ? currentCategoryIds
                  : [...currentCategoryIds, categoryId],
        );
    };

    return (
        <div className={settingsStyles.container}>
            {/* Categories Selection */}
            <div className={settingsStyles.section}>
                <div className={settingsStyles.categoriesGrid}>
                    {availableCategoryIds.map((categoryId) => {
                        const isSelected =
                            selectedCategoryIds.includes(categoryId);
                        const isDisabled =
                            !isSelected &&
                            selectedCategoryIds.length >=
                                MAX_SELECTED_CATEGORIES;

                        return (
                            <button
                                key={categoryId}
                                className={`${settingsStyles.categoryCard} ${
                                    isSelected ? settingsStyles.selected : ""
                                } ${isDisabled ? settingsStyles.disabled : ""}`}
                                onClick={() => toggleCategory(categoryId)}
                                disabled={isDisabled}
                                type="button"
                            >
                                {formatCategoryLabel(categoryId)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Items Per Category */}
            <div className={settingsStyles.section}>
                <div className={settingsStyles.optionsCard}>
                    <label
                        htmlFor="items-select"
                        className={settingsStyles.sectionLabel}
                    >
                        Items per category
                    </label>
                    <select
                        id="items-select"
                        value={itemsPerCategory}
                        onChange={(event) =>
                            setItemsPerCategory(Number(event.target.value))
                        }
                        className={settingsStyles.optionsSelect}
                    >
                        {Array.from(
                            { length: maxItemsPerCategory },
                            (_, index) => {
                                const optionCount = index + 1;
                                return (
                                    <option
                                        key={optionCount}
                                        value={optionCount}
                                    >
                                        {optionCount}{" "}
                                        {optionCount === 1 ? "item" : "items"}
                                    </option>
                                );
                            },
                        )}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default CategorisationSettingsScreen;
