/**
 * ImageOption Component
 *
 * Displays an icon card.
 * Supports interactive states: default, selected, correct, incorrect, disabled.
 */
import styles from "./ImageOption.module.css";
import type { Picture } from "../../lib/types";
import React from "react";

interface ImageOptionProps {
    image: Picture;
    isCorrect: boolean | null;
    isSelected: boolean;
    isDisabled?: boolean;
    optionBackgroundColor?: string;
    isBorderless?: boolean;
    onClick: () => void;
    onPointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
}

export const ImageOption = React.forwardRef<
    HTMLButtonElement,
    ImageOptionProps
>(
    (
        {
            image,
            isCorrect,
            isSelected,
            isDisabled = false,
            optionBackgroundColor,
            isBorderless = false,
            onClick,
            onPointerEnter,
        },
        ref,
    ) => {
        // Determine state classes
        let stateClass:
            | "disabled"
            | "correct"
            | "incorrect"
            | "selected"
            | "interactive" = "interactive";
        if (isDisabled) {
            stateClass = "disabled";
        } else if (isCorrect === true) {
            stateClass = "correct";
        } else if (isCorrect === false) {
            stateClass = "incorrect";
        } else if (isSelected) {
            stateClass = "selected";
        } else {
            stateClass = "interactive";
        }

        return (
            <button
                className={`${styles["icon-block"]} ${styles[stateClass]} ${optionBackgroundColor ? styles.withCustomBackground : ""} ${isBorderless ? styles.borderless : ""}`.trim()}
                onClick={onClick}
                onPointerEnter={onPointerEnter}
                disabled={isDisabled}
                aria-label={
                    image.label || image.altText || `Option ${image.id}`
                }
                type="button"
                ref={ref}
                style={
                    optionBackgroundColor
                        ? {
                              ["--option-bg-color" as string]:
                                  optionBackgroundColor,
                          }
                        : undefined
                }
            >
                <img
                    src={image.imageUrl}
                    alt={image.altText || image.label || "Icon option"}
                    className={styles["icon-block-image"]}
                    style={{ pointerEvents: "none" }}
                />
            </button>
        );
    },
);

ImageOption.displayName = "ImageOption";

export default ImageOption;
