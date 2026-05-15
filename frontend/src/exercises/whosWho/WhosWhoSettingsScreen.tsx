import { useEffect, useState } from "react";
import {
    WhosWhoChoiceCounts,
    WhosWhoPronouns,
    type WhosWhoChoiceCount,
    type WhosWhoPronoun,
    type WhosWhoSettings,
} from "./types";
import styles from "./WhosWhoSettingsScreen.module.css";

const PRONOUN_DETAILS: Record<
    WhosWhoPronoun,
    { label: string; example: string }
> = {
    he: { label: "He", example: "He wants the ball" },
    she: { label: "She", example: "She wants the dress" },
    they: { label: "They", example: "They want the apple" },
    him: { label: "Him", example: "Give the ball to him" },
    her: { label: "Her", example: "Give the hat to her" },
    them: { label: "Them", example: "Give the orange to them" },
};

interface WhosWhoSettingsScreenProps {
    options: WhosWhoSettings;
    instruction: string;
    modellingTip?: string;
    onSetOptions: (options: WhosWhoSettings) => void;
}

export const WhosWhoSettingsScreen = ({
    options,
    instruction,
    modellingTip,
    onSetOptions,
}: WhosWhoSettingsScreenProps) => {
    const [selectedPronouns, setSelectedPronouns] = useState<WhosWhoPronoun[]>(
        () => options.selectedPronouns,
    );
    const [choiceCount, setChoiceCount] = useState<WhosWhoChoiceCount>(
        () => options.choiceCount,
    );

    useEffect(() => {
        onSetOptions({
            choiceCount,
            selectedPronouns,
        });
    }, [choiceCount, onSetOptions, selectedPronouns]);

    const togglePronoun = (pronoun: WhosWhoPronoun) => {
        setSelectedPronouns((currentPronouns) => {
            if (currentPronouns.includes(pronoun)) {
                if (currentPronouns.length === 1) {
                    return currentPronouns;
                }

                return currentPronouns.filter(
                    (currentPronoun) => currentPronoun !== pronoun,
                );
            }

            return [...currentPronouns, pronoun];
        });
    };

    return (
        <div className={styles.container}>
            <p className={styles.text}>{instruction}</p>

            <div className={styles.section}>
                <p className={styles.sectionLabel}>Pronouns to practise</p>
                <div className={styles.pronounsGrid}>
                    {WhosWhoPronouns.map((pronoun) => {
                        const isSelected = selectedPronouns.includes(pronoun);
                        const isDisabled =
                            isSelected && selectedPronouns.length === 1;

                        return (
                            <button
                                key={pronoun}
                                type="button"
                                className={`${styles.pronounCard} ${
                                    isSelected ? styles.selected : ""
                                } ${isDisabled ? styles.disabled : ""}`.trim()}
                                onClick={() => togglePronoun(pronoun)}
                                aria-pressed={isSelected}
                                disabled={isDisabled}
                            >
                                <span className={styles.pronounLabel}>
                                    {PRONOUN_DETAILS[pronoun].label}
                                </span>
                                <span className={styles.pronounExample}>
                                    {PRONOUN_DETAILS[pronoun].example}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.optionsCard}>
                    <label
                        htmlFor="choice-count"
                        className={styles.sectionLabel}
                    >
                        Choices per round
                    </label>
                    <select
                        id="choice-count"
                        value={choiceCount}
                        onChange={(event) =>
                            setChoiceCount(
                                Number(
                                    event.target.value,
                                ) as WhosWhoChoiceCount,
                            )
                        }
                        className={styles.optionsSelect}
                    >
                        {WhosWhoChoiceCounts.map((count) => (
                            <option key={count} value={count}>
                                {count} {count === 1 ? "choice" : "choices"}
                            </option>
                        ))}
                    </select>
                    <p className={styles.helperText}>
                        This is the total number of objects shown, including the
                        correct one.
                    </p>
                </div>
            </div>

            {modellingTip ? <p className={styles.tip}>{modellingTip}</p> : null}
        </div>
    );
};

export default WhosWhoSettingsScreen;
