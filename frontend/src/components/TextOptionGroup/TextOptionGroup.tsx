import type { AnswerState } from "../../lib/types";
import useTts from "../../hooks/useTts";
import styles from "./TextOptionGroup.module.css";

export interface TextOption {
    id: string;
    label: string;
}

interface TextOptionGroupProps {
    options: TextOption[];
    selectedOptionId: string | null;
    answerState?: AnswerState;
    disabled?: boolean;
    onSelect: (id: string) => void;
}

export const TextOptionGroup = ({
    options,
    selectedOptionId,
    answerState = "notAnswered",
    disabled = false,
    onSelect,
}: TextOptionGroupProps) => {
    const { speak } = useTts();
    const layoutClassName =
        options.length === 1
            ? styles.oneOption
            : options.length === 2
              ? styles.twoOptions
              : styles.threeOptions;

    return (
        <div className={`${styles.textOptionsGrid} ${layoutClassName}`}>
            {options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const stateClassName =
                    answerState === "correct" && isSelected
                        ? styles.optionButtonCorrect
                        : answerState === "incorrect" && isSelected
                          ? styles.optionButtonIncorrect
                          : isSelected
                            ? styles.optionButtonSelected
                            : "";

                return (
                    <button
                        key={option.id}
                        className={`${styles.optionButton} ${stateClassName}`.trim()}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={disabled && !isSelected}
                        onClick={() => {
                            if (disabled) {
                                return;
                            }

                            speak(option.label);
                            onSelect(option.id);
                        }}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};

export default TextOptionGroup;
