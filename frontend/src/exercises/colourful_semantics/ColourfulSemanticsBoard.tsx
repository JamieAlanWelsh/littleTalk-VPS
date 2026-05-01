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
    hideTray?: boolean;
    itemCorrectnessMap?: Record<string, boolean>;
    isReadOnly?: boolean;
    itemsById: Record<string, ColourfulSemanticsOption>;
    onDragEnd: (event: DragEndEvent) => void;
    scene: ColourfulSemanticsScene;
    showAllSlotsVisible?: boolean;
    showFeedback?: boolean;
}

const renderPlaceholder = (levelIconUrl: string, levelIconAlt: string) => (
    <img
        src={levelIconUrl}
        alt={levelIconAlt}
        className={styles.placeholderIcon}
    />
);

const getSlotColourClass = (slot: string) => {
    switch (slot) {
        case "who":
            return styles.slotCardWho;
        case "doing":
            return styles.slotCardDoing;
        case "what":
            return styles.slotCardWhat;
        case "where":
            return styles.slotCardWhere;
        default:
            return "";
    }
};

const SLOT_OPTION_BACKGROUND_COLOUR_BY_ID_PREFIX: Record<string, string> = {
    who: "#FF9D2D",
    doing: "#FFEA47",
    what: "#38E87B",
    where: "#5297FF",
};

const getOptionBackgroundColour = (itemId: string) => {
    const [idPrefix] = itemId.split("-");
    return SLOT_OPTION_BACKGROUND_COLOUR_BY_ID_PREFIX[idPrefix];
};

export const ColourfulSemanticsBoard = ({
    activeStepIndex,
    boardState,
    hideTray = false,
    itemCorrectnessMap = {},
    isReadOnly = false,
    itemsById,
    onDragEnd,
    scene,
    showAllSlotsVisible = false,
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

    const renderImage = (itemId: string, isLocked = false) => {
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
                optionBackgroundColor={getOptionBackgroundColour(itemId)}
                isBorderless={isLocked}
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
                            const isLocked =
                                showAllSlotsVisible ||
                                stepIndex < activeStepIndex;
                            const slotStateClass = showAllSlotsVisible
                                ? styles.slotCardVisible
                                : stepIndex === activeStepIndex
                                  ? styles.slotCardActive
                                  : styles.slotCardMuted;
                            const slotColourClass = getSlotColourClass(
                                step.slot,
                            );
                            const slotTitle =
                                isLocked && slotItemId
                                    ? (itemsById[slotItemId]?.label ??
                                      step.title)
                                    : step.title;

                            return (
                                <article
                                    key={step.id}
                                    className={`${styles.slotCard} ${slotColourClass} ${slotStateClass}`.trim()}
                                >
                                    <div className={styles.slotHeader}>
                                        <p className={styles.slotTitle}>
                                            {slotTitle}
                                        </p>
                                    </div>

                                    <div className={styles.slotDropZone}>
                                        <DroppableImageZone
                                            id={
                                                !isReadOnly &&
                                                stepIndex === activeStepIndex
                                                    ? getSlotId(stepIndex)
                                                    : `locked-slot:${stepIndex}`
                                            }
                                        >
                                            {slotItemId
                                                ? renderImage(
                                                      slotItemId,
                                                      isLocked,
                                                  )
                                                : renderPlaceholder(
                                                      step.levelIconUrl,
                                                      step.levelIconAlt,
                                                  )}
                                        </DroppableImageZone>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <div
                    className={`${styles.tray} ${hideTray ? styles.trayHidden : ""}`.trim()}
                    aria-hidden={hideTray}
                >
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
