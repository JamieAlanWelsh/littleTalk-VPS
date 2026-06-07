import { Modifier } from "@dnd-kit/abstract";
import { useDraggable } from "@dnd-kit/react";
import type { PointerEventHandler } from "react";
import type { Picture } from "../../lib/types";
import { ImageOption } from "../ImageOption";

class TouchZoomCompensationModifier extends Modifier {
    apply(operation: Parameters<Modifier["apply"]>[0]) {
        const { activatorEvent, transform } = operation;

        if (
            !(activatorEvent instanceof PointerEvent) ||
            activatorEvent.pointerType !== "touch"
        ) {
            return transform;
        }

        const zoom = Number.parseFloat(
            window
                .getComputedStyle(document.body)
                .getPropertyValue("--exercise-zoom"),
        );

        const resolveLengthToPx = (rawValue: string): number => {
            const trimmedValue = rawValue.trim();
            if (!trimmedValue) {
                return 0;
            }

            const probe = document.createElement("div");
            probe.style.position = "absolute";
            probe.style.visibility = "hidden";
            probe.style.pointerEvents = "none";
            probe.style.height = trimmedValue;
            document.body.appendChild(probe);
            const px = probe.getBoundingClientRect().height;
            probe.remove();

            return Number.isFinite(px) ? px : 0;
        };

        const bodyStyles = window.getComputedStyle(document.body);
        const touchHotspotOffsetX = resolveLengthToPx(
            bodyStyles.getPropertyValue(
                "--exercise-touch-drag-hotspot-offset-x",
            ),
        );
        const touchHotspotOffsetY = resolveLengthToPx(
            bodyStyles.getPropertyValue(
                "--exercise-touch-drag-hotspot-offset-y",
            ),
        );

        if (!Number.isFinite(zoom) || zoom <= 0) {
            return transform;
        }

        return {
            x: (transform.x + touchHotspotOffsetX) / zoom,
            y: (transform.y + touchHotspotOffsetY) / zoom,
        };
    }
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
        modifiers: [TouchZoomCompensationModifier],
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
