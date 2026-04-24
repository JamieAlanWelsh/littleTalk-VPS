import { useDraggable } from "@dnd-kit/react";
import type { Picture } from "../../lib/types";
import { ImageOption } from "../ImageOption";

interface DraggableImageProps {
    id: string;
    image: Picture;
    isCorrect: boolean | null;
    isSelected: boolean;
    isDisabled?: boolean;
    onClick: () => void;
}

export const DraggableImage = ({
    id,
    image,
    isCorrect,
    isSelected,
    isDisabled = false,
    onClick,
}: DraggableImageProps) => {
    const { ref } = useDraggable({
        id,
        type: "draggable-image",
    });

    return (
        <ImageOption
            image={image}
            isCorrect={isCorrect}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onClick={onClick}
            ref={ref}
        />
    );
};
