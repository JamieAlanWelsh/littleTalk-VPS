import type { DragEndEvent } from "@dnd-kit/abstract";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import {
    DragDropProvider,
    KeyboardSensor,
    PointerSensor,
} from "@dnd-kit/react";
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

const SLOT_LABELS = ["First", "Next", "Then"];

export const StoryTrainBoard = ({
    boardState,
    itemsById,
    onDragEnd,
    itemCorrectnessMap = {},
    showFeedback = false,
}: StoryTrainBoardProps) => {
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
        <div className={styles.board}>
            <DragDropProvider sensors={sensors} onDragEnd={onDragEnd}>
                <div className={styles.slotsCard}>
                    <div className={styles.slotsGrid}>
                        {SLOT_LABELS.map((label, slotIndex) => {
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
