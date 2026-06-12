import { DragOverlay } from "@dnd-kit/react";
import { createPortal } from "react-dom";
import { ImageOption } from "../ImageOption";
import type { DraggableImageDragData } from "../DraggableImage/DraggableImage";

const isDraggableImageSource = (
    source: unknown,
): source is {
    type: "draggable-image";
    data: DraggableImageDragData;
} => {
    if (!source || typeof source !== "object") {
        return false;
    }

    const typedSource = source as {
        type?: unknown;
        data?: unknown;
    };

    if (typedSource.type !== "draggable-image") {
        return false;
    }

    const data = typedSource.data;
    if (!data || typeof data !== "object") {
        return false;
    }

    return "image" in data;
};

export const DragImageOverlay = () => {
    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <DragOverlay style={{ pointerEvents: "none" }}>
            {(source) => {
                if (!isDraggableImageSource(source)) {
                    return null;
                }

                return (
                    <ImageOption
                        image={source.data.image}
                        isCorrect={source.data.isCorrect}
                        isSelected={source.data.isSelected}
                        isDisabled={source.data.isDisabled}
                        fitToContainer
                        optionBackgroundColor={
                            source.data.optionBackgroundColor
                        }
                        isBorderless={source.data.isBorderless}
                        isDragging={false}
                        onClick={() => {}}
                    />
                );
            }}
        </DragOverlay>,
        document.body,
    );
};

export default DragImageOverlay;
