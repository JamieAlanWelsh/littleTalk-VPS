import { useEffect, useState } from "react";
import styles from "./WhatsInTheBagSettingsScreen.module.css";
import type { WhatsInTheBagOptions } from "./types";

interface WhatsInTheBagSettingsScreenProps {
    onSetOptions: (options: WhatsInTheBagOptions) => void;
}

export const WhatsInTheBagSettingsScreen = ({
    onSetOptions,
}: WhatsInTheBagSettingsScreenProps) => {
    const [selectedNumOptions, setSelectedNumOptions] = useState<1 | 2 | 3>(3);
    const optionCounts: Array<1 | 2 | 3> = [1, 2, 3];

    useEffect(() => {
        onSetOptions({ numberOfOptions: selectedNumOptions });
    }, [selectedNumOptions, onSetOptions]);

    return (
        <div className={styles.section}>
            <div className={styles.optionsCard}>
                <label
                    htmlFor="whats-in-the-bag-choice-count"
                    className={styles.sectionLabel}
                >
                    Choices per round
                </label>
                <select
                    id="whats-in-the-bag-choice-count"
                    value={selectedNumOptions}
                    onChange={(event) =>
                        setSelectedNumOptions(
                            Number(event.target.value) as 1 | 2 | 3,
                        )
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

export default WhatsInTheBagSettingsScreen;
