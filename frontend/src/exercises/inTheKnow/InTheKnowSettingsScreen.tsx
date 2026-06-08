import { useEffect, useState } from "react";
import { InTheKnowChoiceCounts, type InTheKnowChoiceCount } from "./types";
import styles from "./InTheKnowSettingsScreen.module.css";

interface InTheKnowSettingsScreenProps {
    choiceCount: InTheKnowChoiceCount;
    onSetChoiceCount: (choiceCount: InTheKnowChoiceCount) => void;
}

export const InTheKnowSettingsScreen = ({
    choiceCount,
    onSetChoiceCount,
}: InTheKnowSettingsScreenProps) => {
    const [selectedChoiceCount, setSelectedChoiceCount] =
        useState<InTheKnowChoiceCount>(choiceCount);

    useEffect(() => {
        onSetChoiceCount(selectedChoiceCount);
    }, [onSetChoiceCount, selectedChoiceCount]);

    return (
        <div className={styles.section}>
            <div className={styles.optionsCard}>
                <label
                    htmlFor="in-the-know-choice-count"
                    className={styles.sectionLabel}
                >
                    Choices per round
                </label>
                <select
                    id="in-the-know-choice-count"
                    value={selectedChoiceCount}
                    onChange={(event) =>
                        setSelectedChoiceCount(
                            Number(event.target.value) as InTheKnowChoiceCount,
                        )
                    }
                    className={styles.optionsSelect}
                >
                    {InTheKnowChoiceCounts.map((count) => (
                        <option key={count} value={count}>
                            {count} choices
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default InTheKnowSettingsScreen;
