import Button from "../Button/Button";
import styles from "./TextOptionGroup.module.css";

export interface TextOption {
    id: string;
    label: string;
}

interface TextOptionGroupProps {
    options: TextOption[];
    selectedOptionId: string | null;
    disabled?: boolean;
    onSelect: (id: string) => void;
}

export const TextOptionGroup = ({
    options,
    selectedOptionId,
    disabled = false,
    onSelect,
}: TextOptionGroupProps) => {
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

                return (
                    <Button
                        key={option.id}
                        label={option.label}
                        variant={isSelected ? "primary" : "secondary"}
                        width="100%"
                        disabled={disabled && !isSelected}
                        onClick={() => {
                            if (disabled) {
                                return;
                            }

                            onSelect(option.id);
                        }}
                    />
                );
            })}
        </div>
    );
};

export default TextOptionGroup;
