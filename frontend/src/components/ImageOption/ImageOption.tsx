/* eslint-disable no-useless-assignment */
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
    onClick: () => void;
}

export const ImageOption = React.forwardRef<
    HTMLButtonElement,
    ImageOptionProps
>(({ image, isCorrect, isSelected, isDisabled = false, onClick }, ref) => {
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
            className={`${styles["icon-block"]} ${styles[stateClass]}`}
            onClick={onClick}
            disabled={isDisabled}
            aria-label={image.label || image.altText || `Option ${image.id}`}
            type="button"
            ref={ref}
        >
            <img
                src={image.imageUrl}
                alt={image.altText || image.label || "Icon option"}
                className={styles["icon-block-image"]}
                style={{ pointerEvents: "none" }}
            />
        </button>
    );
});

ImageOption.displayName = "ImageOption";

export default ImageOption;
