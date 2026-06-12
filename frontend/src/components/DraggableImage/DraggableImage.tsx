import { useDraggable } from "@dnd-kit/react";
import type { PointerEventHandler } from "react";
import type { Picture } from "../../lib/types";
import { ImageOption } from "../ImageOption";

export interface DraggableImageDragData {
    image: Picture;
    isCorrect: boolean | null;
    isSelected: boolean;
    isDisabled?: boolean;
    optionBackgroundColor?: string;
    isBorderless: boolean;
}

interface DraggableImageProps {
    id: string;
    image: Picture;
    isCorrect: boolean | null;
    isSelected: boolean;
    isDisabled?: boolean;
    optionBackgroundColor?: string;
    isBorderless?: boolean;
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
    onClick,
    onPointerEnter,
}: DraggableImageProps) => {
    const { isDragging, ref } = useDraggable({
        id,
        type: "draggable-image",
        data: {
            image,
            isCorrect,
            isSelected,
            isDisabled,
            optionBackgroundColor,
            isBorderless,
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
            ref={ref}
        />
    );
};
