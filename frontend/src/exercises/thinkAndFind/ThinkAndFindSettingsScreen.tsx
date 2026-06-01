/**
 * Think & Find settings screen
 *
 * Lets the user choose how many image options appear in each round.
 */

import { useEffect, useState } from "react";
import type { SentenceMatchingOptions } from "../../lib/types";
import styles from "./ThinkAndFindSettingsScreen.module.css";

interface ThinkAndFindSettingsScreenProps {
    onSetOptions: (options: SentenceMatchingOptions) => void;
}

export const ThinkAndFindSettingsScreen = ({
    onSetOptions,
}: ThinkAndFindSettingsScreenProps) => {
    const [selectedNumOptions, setSelectedNumOptions] = useState(3);
    const optionCounts = [2, 3, 4, 5, 6];

    useEffect(() => {
        onSetOptions({ numberOfOptions: selectedNumOptions });
    }, [selectedNumOptions, onSetOptions]);

    return (
        <div className={styles.section}>
            <div className={styles.optionsCard}>
                <label
                    htmlFor="think-and-find-choice-count"
                    className={styles.sectionLabel}
                >
                    Choices per round
                </label>
                <select
                    id="think-and-find-choice-count"
                    value={selectedNumOptions}
                    onChange={(event) =>
                        setSelectedNumOptions(Number(event.target.value))
                    }
                    className={styles.optionsSelect}
                >
                    {optionCounts.map((count) => (
                        <option key={count} value={count}>
                            {count} {count === 1 ? "choice" : "choices"}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ThinkAndFindSettingsScreen;
