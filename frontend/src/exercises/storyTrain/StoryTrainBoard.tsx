import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    type DragEndEvent,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { DragImageOverlay } from "../../components/DragImageOverlay/DragImageOverlay";
import { DraggableImage } from "../../components/DraggableImage/DraggableImage";
import { DroppableImageZone } from "../../components/DroppableImageZone/DroppableImageZone";
import { PoolTray } from "../../components/PoolTray/PoolTray";
import type { BoardState } from "./boardUtils";
import type { StoryTrainStep } from "./types";
import styles from "./StoryTrainBoard.module.css";

interface StoryTrainBoardProps {
    boardState: BoardState;
    itemsById: Record<string, StoryTrainStep>;
    onDragEnd: (event: DragEndEvent) => void;
    itemCorrectnessMap?: Record<string, boolean>;
    showFeedback?: boolean;
}

const getSlotLabels = (slotCount: number) => {
    if (slotCount === 4) {
        return ["First", "Next", "Then", "Finally"];
    }

    return ["First", "Next", "Then"];
};

export const StoryTrainBoard = ({
    boardState,
    itemsById,
    onDragEnd,
    itemCorrectnessMap = {},
    showFeedback = false,
}: StoryTrainBoardProps) => {
    const isFourSlotBoard = boardState.slotItemIds.length === 4;
    const slotLabels = getSlotLabels(boardState.slotItemIds.length);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 1 },
        }),
        useSensor(KeyboardSensor),
    );

    const renderImage = (itemId: string) => {
        const item = itemsById[itemId];
        const isCorrect = showFeedback ? itemCorrectnessMap[itemId] : null;

        return (
            <DraggableImage
                key={itemId}
                id={itemId}
                image={item}
                isCorrect={isCorrect}
                isSelected={false}
                coverFit
                onClick={() => {}}
            />
        );
    };

    return (
        <div
            className={`${styles.board} ${isFourSlotBoard ? styles.boardFourSlots : ""}`}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={(args) => {
                    const pointerCollisions = pointerWithin(args);
                    return pointerCollisions.length > 0
                        ? pointerCollisions
                        : rectIntersection(args);
                }}
                onDragEnd={onDragEnd}
            >
                <DragImageOverlay />
                <div className={styles.slotsCard}>
                    <div
                        className={`${styles.slotsGrid} ${isFourSlotBoard ? styles.slotsGridFour : ""}`}
                    >
                        {slotLabels.map((label, slotIndex) => {
                            const itemId = boardState.slotItemIds[slotIndex];

                            return (
                                <div key={label} className={styles.slotGroup}>
                                    <p className={styles.slotLabel}>{label}</p>
                                    <div className={styles.slotZone}>
                                        <DroppableImageZone
                                            id={`slot:${slotIndex}`}
                                        >
                                            {itemId
                                                ? renderImage(itemId)
                                                : null}
                                        </DroppableImageZone>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <PoolTray
                    id="pool"
                    itemIds={boardState.poolItemIds}
                    renderItem={renderImage}
                />
            </DndContext>
        </div>
    );
};

export default StoryTrainBoard;
