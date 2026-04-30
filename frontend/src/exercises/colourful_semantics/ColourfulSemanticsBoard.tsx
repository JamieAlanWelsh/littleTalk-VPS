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
import useAudio from "../../hooks/useAudio";
import styles from "./colourfulSemantics.module.css";
import type {
    ColourfulSemanticsOption,
    ColourfulSemanticsScene,
} from "./types";
import type { SentenceBoardState } from "./boardUtils";
import { getSlotId, POOL_ID } from "./boardUtils";

interface ColourfulSemanticsBoardProps {
    activeStepIndex: number;
    boardState: SentenceBoardState;
    itemCorrectnessMap?: Record<string, boolean>;
    itemsById: Record<string, ColourfulSemanticsOption>;
    onDragEnd: (event: DragEndEvent) => void;
    scene: ColourfulSemanticsScene;
    showFeedback?: boolean;
}

const renderPlaceholder = (slotTitle: string) => (
    <span className={styles.placeholder}>Choose the {slotTitle} word</span>
);

export const ColourfulSemanticsBoard = ({
    activeStepIndex,
    boardState,
    itemCorrectnessMap = {},
    itemsById,
    onDragEnd,
    scene,
    showFeedback = false,
}: ColourfulSemanticsBoardProps) => {
    const { play } = useAudio();
    const sensors = [
        PointerSensor.configure({
            activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 1 }),
            ],
        }),
        KeyboardSensor,
    ];

    const playItemSfx = (item: ColourfulSemanticsOption) => {
        if (!item.sfxUrl) {
            return;
        }

        play(item.sfxUrl);
    };

    const renderImage = (itemId: string) => {
        const item = itemsById[itemId];
        const isCorrect = showFeedback ? itemCorrectnessMap[itemId] : null;

        return (
            <DraggableImage
                key={itemId}
                id={itemId}
                image={{
                    id: item.id,
                    imageUrl: item.imageUrl,
                    label: item.label,
                    sfxUrl: item.sfxUrl,
                }}
                isCorrect={isCorrect}
                isSelected={false}
                onClick={() => {
                    playItemSfx(item);
                }}
                onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                        playItemSfx(item);
                    }
                }}
            />
        );
    };

    return (
        <DragDropProvider sensors={sensors} onDragEnd={onDragEnd}>
            <div className={styles.board}>
                <section className={styles.imageCard}>
                    <img
                        src={scene.targetImageUrl}
                        alt={scene.targetImageAlt}
                        className={styles.targetImage}
                    />
                </section>

                <section className={styles.sentencePanel}>
                    <div className={styles.slots}>
                        {scene.steps.map((step, stepIndex) => {
                            const slotItemId =
                                boardState.slotItemIds[stepIndex];
                            const slotStateClass =
                                stepIndex < activeStepIndex
                                    ? styles.slotCardLocked
                                    : stepIndex === activeStepIndex
                                      ? styles.slotCardActive
                                      : styles.slotCardFuture;

                            return (
                                <article
                                    key={step.id}
                                    className={`${styles.slotCard} ${slotStateClass}`.trim()}
                                    style={{ backgroundColor: step.color }}
                                >
                                    <div className={styles.slotHeader}>
                                        <img
                                            src={step.levelIconUrl}
                                            alt={step.levelIconAlt}
                                            className={styles.slotIcon}
                                        />
                                        <p className={styles.slotTitle}>
                                            {step.title}
                                        </p>
                                        <p className={styles.slotPrompt}>
                                            {step.prompt}
                                        </p>
                                    </div>

                                    <div className={styles.slotDropZone}>
                                        <DroppableImageZone
                                            id={
                                                stepIndex === activeStepIndex
                                                    ? getSlotId(stepIndex)
                                                    : `locked-slot:${stepIndex}`
                                            }
                                        >
                                            {slotItemId
                                                ? renderImage(slotItemId)
                                                : renderPlaceholder(step.title)}
                                        </DroppableImageZone>
                                    </div>

                                    {stepIndex < activeStepIndex && (
                                        <p className={styles.lockedBadge}>
                                            locked in
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </section>

                <div className={styles.tray}>
                    <PoolTray
                        id={POOL_ID}
                        itemIds={boardState.poolItemIds}
                        itemsById={itemsById}
                        renderItem={renderImage}
                    />
                </div>
            </div>
        </DragDropProvider>
    );
};

export default ColourfulSemanticsBoard;
