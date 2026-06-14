import { useDraggable } from "@dnd-kit/core";
import type { PointerEventHandler } from "react";
import type { Picture } from "../../lib/types";
import { ImageOption } from "../ImageOption";

export interface DraggableImageDragData {
    dragType: "draggable-image";
    image: Picture;
    isCorrect: boolean | null;
    isSelected: boolean;
    isDisabled?: boolean;
    optionBackgroundColor?: string;
    isBorderless: boolean;
    coverFit?: boolean;
}

interface DraggableImageProps {
    id: string;
    image: Picture;
    isCorrect: boolean | null;
    isSelected: boolean;
    isDisabled?: boolean;
    optionBackgroundColor?: string;
    isBorderless?: boolean;
    coverFit?: boolean;
    onClick: () => void;
    onPointerEnter?: PointerEventHandler<HTMLButtonElement>;
}

export const DraggableImage = ({
    id,
    image,
    isCorrect,
    isSelected,
    isDisabled = false,
    optionBackgroundColor,
    isBorderless = false,
    coverFit = false,
    onClick,
    onPointerEnter,
}: DraggableImageProps) => {
    const { isDragging, setNodeRef, attributes, listeners } = useDraggable({
        id,
        data: {
            dragType: "draggable-image",
            image,
            isCorrect,
            isSelected,
            isDisabled,
            optionBackgroundColor,
            isBorderless,
            coverFit,
        } satisfies DraggableImageDragData,
    });

    return (
        <ImageOption
            image={image}
            isCorrect={isCorrect}
            isSelected={isSelected}
            isDisabled={isDisabled}
            optionBackgroundColor={optionBackgroundColor}
            isBorderless={isBorderless}
            isDragging={isDragging}
            onClick={onClick}
            onPointerEnter={onPointerEnter}
            dndButtonProps={{ ...attributes, ...listeners }}
            ref={setNodeRef}
        />
    );
};
