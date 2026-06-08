import type { DragEndEvent } from "@dnd-kit/abstract";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import {
    DragDropProvider,
    KeyboardSensor,
    PointerSensor,
} from "@dnd-kit/react";
import { useState } from "react";
import { DraggableImage } from "../../components/DraggableImage/DraggableImage";
import { DroppableImageZone } from "../../components/DroppableImageZone/DroppableImageZone";
import { PoolTray } from "../../components/PoolTray/PoolTray";
import type { AnswerState } from "../../lib/types";
import type { WhosWhoItem, WhosWhoScenario, WhosWhoTarget } from "./types";
import styles from "./WhosWhoBoard.module.css";

interface RoundState {
    trayItemIds: string[];
    placedItemId: string | null;
    placedTargetId: string | null;
}

interface WhosWhoBoardProps {
    scenario: WhosWhoScenario;
    targets: WhosWhoTarget[];
    itemById: Record<string, WhosWhoItem>;
    currentRoundState: RoundState;
    answerState: AnswerState;
    onDragEnd: (event: DragEndEvent) => void;
}

type TargetVisualState = "base" | "reaching" | "happy";

const renderTrayItem = (
    itemId: string,
    itemById: Record<string, WhosWhoItem>,
    answerState: AnswerState,
    scenario: WhosWhoScenario,
) => {
    const item = itemById[itemId];

    if (!item) {
        return null;
    }

    const isAnswerChecked = answerState !== "notAnswered";
    const isCorrect =
        answerState === "correct"
            ? item.id === scenario.draggableItemId
            : answerState === "incorrect"
              ? item.id === scenario.draggableItemId
                  ? false
                  : null
              : null;

    return (
        <DraggableImage
            key={itemId}
            id={itemId}
            image={item}
            isCorrect={isCorrect}
            isSelected={false}
            isDisabled={isAnswerChecked}
            onClick={() => {}}
        />
    );
};

const renderAttachedItem = (
    itemId: string,
    itemById: Record<string, WhosWhoItem>,
    answerState: AnswerState,
) => {
    const item = itemById[itemId];

    if (!item) {
        return null;
    }

    const isCorrect =
        answerState === "correct"
            ? true
            : answerState === "incorrect"
              ? false
              : null;

    return (
        <div className={styles.attachedItem}>
            <DraggableImage
                id={itemId}
                image={item}
                isCorrect={isCorrect}
                isSelected={false}
                isDisabled={answerState !== "notAnswered"}
                isBorderless={true}
                onClick={() => {}}
            />
        </div>
    );
};

const getTargetVisualState = ({
    answerState,
    isDragging,
    isHoldingItem,
}: {
    answerState: AnswerState;
    isDragging: boolean;
    isHoldingItem: boolean;
}): TargetVisualState => {
    if (answerState === "correct" && isHoldingItem) {
        return "happy";
    }

    if (isDragging) {
        return "reaching";
    }

    if (isHoldingItem) {
        return "reaching";
    }

    return "base";
};

export const WhosWhoBoard = ({
    scenario,
    targets,
    itemById,
    currentRoundState,
    answerState,
    onDragEnd,
}: WhosWhoBoardProps) => {
    const [isDragging, setIsDragging] = useState(false);

    const sensors = [
        PointerSensor.configure({
            activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 1 }),
            ],
        }),
        KeyboardSensor,
    ];

    const handleDragStart = () => {
        if (answerState !== "notAnswered") {
            return;
        }

        setIsDragging(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDragging(false);
        onDragEnd(event);
    };

    return (
        <div className={styles.wrapper}>
            <DragDropProvider
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.targetsRow}>
                    {targets.map((target) => {
                        const hasPlacedItem =
                            currentRoundState.placedTargetId === target.id &&
                            Boolean(currentRoundState.placedItemId);
                        const targetVisualState = getTargetVisualState({
                            answerState,
                            isDragging,
                            isHoldingItem: hasPlacedItem,
                        });
                        const targetResultClass =
                            answerState === "correct" && hasPlacedItem
                                ? styles.targetCorrect
                                : answerState === "incorrect" && hasPlacedItem
                                  ? styles.targetIncorrect
                                  : "";

                        return (
                            <div key={target.id} className={styles.targetCard}>
                                <div
                                    className={`${styles.targetZone} ${targetResultClass}`.trim()}
                                >
                                    <DroppableImageZone
                                        id={`target:${target.id}`}
                                    >
                                        <div className={styles.targetContent}>
                                            <img
                                                className={styles.targetImage}
                                                src={
                                                    target.images[
                                                        targetVisualState
                                                    ]
                                                }
                                                alt={
                                                    target.altText ??
                                                    target.label
                                                }
                                            />
                                            {hasPlacedItem
                                                ? renderAttachedItem(
                                                      String(
                                                          currentRoundState.placedItemId,
                                                      ),
                                                      itemById,
                                                      answerState,
                                                  )
                                                : null}
                                        </div>
                                    </DroppableImageZone>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <PoolTray
                    id="tray"
                    itemIds={currentRoundState.trayItemIds}
                    renderItem={(itemId) =>
                        renderTrayItem(itemId, itemById, answerState, scenario)
                    }
                    itemsById={itemById}
                />
            </DragDropProvider>
        </div>
    );
};

export default WhosWhoBoard;
