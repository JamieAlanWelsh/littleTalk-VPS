/**
 * Concept Quest settings screen
 *
 * Lets the user choose which concepts to practise and the prompt complexity.
 */

import { useEffect, useState, type ChangeEvent } from "react";
import type {
    ConceptQuestConcept,
    ConceptQuestComplexity,
    ConceptQuestOptions,
} from "../../lib/types";
import styles from "./conceptQuest.module.css";

interface ConceptQuestSettingsScreenProps {
    onSetOptions: (options: ConceptQuestOptions) => void;
}

const CONCEPT_OPTIONS: Array<{ label: string; value: ConceptQuestConcept }> = [
    { label: "Big", value: "big" },
    { label: "Small", value: "small" },
    { label: "Short", value: "short" },
    { label: "Long", value: "long" },
    { label: "Tall", value: "tall" },
];

const COMPLEXITY_OPTIONS: Array<{
    label: string;
    value: ConceptQuestComplexity;
}> = [
    { label: "positive e.g. big", value: 1 },
    { label: "comparative e.g. bigger", value: 2 },
    { label: "superlative e.g. biggest", value: 3 },
    { label: "comparative+ e.g. bigger but not biggest", value: 4 },
    { label: "descriptive e.g. almost biggest (hard)", value: 5 },
];

const DEFAULT_CONCEPTS: ConceptQuestConcept[] = CONCEPT_OPTIONS.map(
    (option) => option.value,
);

export const ConceptQuestSettingsScreen = ({
    onSetOptions,
}: ConceptQuestSettingsScreenProps) => {
    const [selectedConcepts, setSelectedConcepts] =
        useState<ConceptQuestConcept[]>(DEFAULT_CONCEPTS);
    const [allowMultipleComplexities, setAllowMultipleComplexities] =
        useState(false);
    const [selectedComplexities, setSelectedComplexities] = useState<
        ConceptQuestComplexity[]
    >([1]);

    useEffect(() => {
        onSetOptions({
            concepts: selectedConcepts,
            complexities: selectedComplexities,
        });
    }, [onSetOptions, selectedComplexities, selectedConcepts]);

    const toggleConcept = (concept: ConceptQuestConcept) => {
        setSelectedConcepts((currentConcepts) => {
            const isSelected = currentConcepts.includes(concept);

            if (isSelected && currentConcepts.length === 1) {
                return currentConcepts;
            }

            if (isSelected) {
                return currentConcepts.filter((item) => item !== concept);
            }

            return CONCEPT_OPTIONS.map((option) => option.value).filter(
                (item) => currentConcepts.includes(item) || item === concept,
            );
        });
    };

    const toggleComplexity = (complexity: ConceptQuestComplexity) => {
        if (!allowMultipleComplexities) {
            setSelectedComplexities([complexity]);
            return;
        }

        setSelectedComplexities((currentComplexities) => {
            const isSelected = currentComplexities.includes(complexity);

            if (isSelected && currentComplexities.length === 1) {
                return currentComplexities;
            }

            if (isSelected) {
                return currentComplexities.filter(
                    (item) => item !== complexity,
                );
            }

            return COMPLEXITY_OPTIONS.map((option) => option.value).filter(
                (item) =>
                    currentComplexities.includes(item) || item === complexity,
            );
        });
    };

    const onMultipleComplexitiesToggle = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const isEnabled = event.target.checked;
        setAllowMultipleComplexities(isEnabled);

        if (!isEnabled) {
            setSelectedComplexities((currentComplexities) => [
                currentComplexities[0],
            ]);
        }
    };

    return (
        <div className={styles.container}>
            <section className={styles.section}>
                <p className={styles.sectionLabel}>
                    Concepts (Select 1 or more)
                </p>
                <div className={styles.categoriesGrid}>
                    {CONCEPT_OPTIONS.map((option) => {
                        const isSelected = selectedConcepts.includes(
                            option.value,
                        );

                        return (
                            <button
                                key={option.value}
                                className={`${styles.categoryCard} ${
                                    isSelected ? styles.selected : ""
                                }`}
                                onClick={() => toggleConcept(option.value)}
                                type="button"
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className={styles.section}>
                <p className={styles.sectionLabel}>Concept complexities</p>
                <label className={styles.complexityToggleRow}>
                    <input
                        type="checkbox"
                        checked={allowMultipleComplexities}
                        onChange={onMultipleComplexitiesToggle}
                    />
                    Select 1 or more
                </label>
                <div className={styles.categoriesGrid}>
                    {COMPLEXITY_OPTIONS.map((option) => {
                        const isSelected = selectedComplexities.includes(
                            option.value,
                        );

                        return (
                            <button
                                key={option.value}
                                className={`${styles.categoryCard} ${
                                    isSelected ? styles.selected : ""
                                }`}
                                onClick={() => toggleComplexity(option.value)}
                                type="button"
                            >
                                <span className={styles.cardTitle}>
                                    {option.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default ConceptQuestSettingsScreen;
