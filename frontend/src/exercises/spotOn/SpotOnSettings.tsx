import { useEffect, useState } from "react";
import styles from "./SpotOnSettings.module.css";
import {
    DEFAULT_SPOT_ON_PREPOSITIONS,
    SPOT_ON_PREPOSITIONS,
    type SpotOnOptions,
    type SpotOnPreposition,
} from "./types";

const DEFAULT_SELECTED_PREPOSITIONS = [...DEFAULT_SPOT_ON_PREPOSITIONS];

interface SpotOnSettingsProps {
    onSetOptions: (options: SpotOnOptions) => void;
}

const formatLabel = (preposition: string) =>
    preposition
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export const SpotOnSettings = ({ onSetOptions }: SpotOnSettingsProps) => {
    const [selectedPrepositions, setSelectedPrepositions] = useState<
        SpotOnPreposition[]
    >(() => DEFAULT_SELECTED_PREPOSITIONS);

    useEffect(() => {
        onSetOptions({ selectedPrepositions });
    }, [onSetOptions, selectedPrepositions]);

    const togglePreposition = (preposition: SpotOnPreposition) => {
        setSelectedPrepositions((currentPrepositions) => {
            const isSelected = currentPrepositions.includes(preposition);

            if (isSelected) {
                if (currentPrepositions.length === 1) {
                    return currentPrepositions;
                }

                return currentPrepositions.filter(
                    (currentPreposition) => currentPreposition !== preposition,
                );
            }

            return [...currentPrepositions, preposition];
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.section}>
                <div className={styles.categoriesGrid}>
                    {SPOT_ON_PREPOSITIONS.map((preposition) => {
                        const isSelected =
                            selectedPrepositions.includes(preposition);

                        return (
                            <button
                                key={preposition}
                                className={`${styles.categoryCard} ${
                                    isSelected ? styles.selected : ""
                                }`.trim()}
                                onClick={() => togglePreposition(preposition)}
                                type="button"
                            >
                                {formatLabel(preposition)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.optionsCard}>
                    <p className={styles.sectionLabel}>Selected prepositions</p>
                    <p className={styles.selectedCount}>
                        {selectedPrepositions.length} of{" "}
                        {SPOT_ON_PREPOSITIONS.length} selected
                    </p>
                    <p className={styles.optionsLabel}>
                        Choose the location words you want to practise in this
                        session.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SpotOnSettings;
