import { DragOverlay, useDndContext } from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { ImageOption } from "../ImageOption";
import type { DraggableImageDragData } from "../DraggableImage/DraggableImage";

const isDraggableImageData = (
    data: unknown,
): data is DraggableImageDragData => {
    if (!data || typeof data !== "object") {
        return false;
    }

    const typedData = data as Partial<DraggableImageDragData>;

    return typedData.dragType === "draggable-image" && "image" in typedData;
};

export const DragImageOverlay = () => {
    const { active } = useDndContext();

    if (typeof document === "undefined") {
        return null;
    }

    const dragData = active?.data.current;
    const draggableImageData = isDraggableImageData(dragData) ? dragData : null;

    return createPortal(
        <DragOverlay style={{ pointerEvents: "none" }}>
            {draggableImageData ? (
                <ImageOption
                    image={draggableImageData.image}
                    isCorrect={draggableImageData.isCorrect}
                    isSelected={draggableImageData.isSelected}
                    isDisabled={draggableImageData.isDisabled}
                    fitToContainer
                    optionBackgroundColor={
                        draggableImageData.optionBackgroundColor
                    }
                    isBorderless={draggableImageData.isBorderless}
                    isDragging={false}
                    onClick={() => {}}
                />
            ) : null}
        </DragOverlay>,
        document.body,
    );
};

export default DragImageOverlay;
