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
    isDragging?: boolean;
    fitToContainer?: boolean;
    isDisabled?: boolean;
    optionBackgroundColor?: string;
    isBorderless?: boolean;
    onClick: () => void;
    onPointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
    dndButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    style?: React.CSSProperties;
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
            isDragging = false,
            fitToContainer = false,
            isDisabled = false,
            optionBackgroundColor,
            isBorderless = false,
            onClick,
            onPointerEnter,
            dndButtonProps,
            style: extraStyle,
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
                {...dndButtonProps}
                className={`${styles["icon-block"]} ${styles[stateClass]} ${optionBackgroundColor ? styles.withCustomBackground : ""} ${isBorderless ? styles.borderless : ""} ${isDragging ? styles.dragging : ""}`.trim()}
                onClick={onClick}
                onPointerEnter={onPointerEnter}
                disabled={isDisabled}
                aria-label={
                    image.label || image.altText || `Option ${image.id}`
                }
                type="button"
                draggable={false}
                ref={ref}
                style={{
                    ...(optionBackgroundColor
                        ? {
                              ["--option-bg-color" as string]:
                                  optionBackgroundColor,
                          }
                        : {}),
                    ...(fitToContainer
                        ? {
                              ["--icon-block-width" as string]: "100%",
                              ["--icon-block-height" as string]: "100%",
                              ["--icon-block-img-width" as string]: "100%",
                              ["--icon-block-img-height" as string]: "100%",
                              ["--icon-block-padding" as string]:
                                  "clamp(0.3rem, 3.5%, 1rem)",
                          }
                        : {}),
                    ...extraStyle,
                }}
            >
                <img
                    src={image.imageUrl}
                    alt={image.altText || image.label || "Icon option"}
                    className={styles["icon-block-image"]}
                    draggable={false}
                    style={{ pointerEvents: "none" }}
                />
            </button>
        );
    },
);

ImageOption.displayName = "ImageOption";

export default ImageOption;
