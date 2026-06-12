import type { DragEndEvent } from "@dnd-kit/abstract";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import {
    DragDropProvider,
    KeyboardSensor,
    PointerSensor,
} from "@dnd-kit/react";
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
    const sensors = [
        PointerSensor.configure({
            activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 1 }),
            ],
        }),
        KeyboardSensor,
    ];

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
                onClick={() => {}}
            />
        );
    };

    return (
        <div
            className={`${styles.board} ${isFourSlotBoard ? styles.boardFourSlots : ""}`}
        >
            <DragDropProvider sensors={sensors} onDragEnd={onDragEnd}>
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
            </DragDropProvider>
        </div>
    );
};

export default StoryTrainBoard;
