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
import { getIsPluralSubject, resolveOptionPresentation } from "./presentation";
import { COLOURFUL_SEMANTICS_SLOT_METADATA } from "./slotMetadata";
import type {
    ColourfulSemanticsOption,
    ColourfulSemanticsSlot,
    ConfiguredColourfulSemanticsScene,
} from "./types";
import { COLOURFUL_SEMANTICS_SLOT_IDS } from "./types";
import type { SentenceBoardState } from "./boardUtils";
import { getSlotId, POOL_ID } from "./boardUtils";

interface ColourfulSemanticsBoardProps {
    activeStepIndex: number;
    boardState: SentenceBoardState;
    hideTray?: boolean;
    isVoiceMuted?: boolean;
    itemCorrectnessMap?: Record<string, boolean>;
    isReadOnly?: boolean;
    itemsById: Record<string, ColourfulSemanticsOption>;
    onDragEnd: (event: DragEndEvent) => void;
    scene: ConfiguredColourfulSemanticsScene;
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

const getSlotColourClass = (slot: ColourfulSemanticsSlot) => {
    switch (slot) {
        case "who":
            return styles.slotCardWho;
        case "doing":
            return styles.slotCardDoing;
        case "what":
            return styles.slotCardWhat;
        case "to-who":
            return styles.slotCardToWho;
        case "where":
            return styles.slotCardWhere;
        case "when":
            return styles.slotCardWhen;
        case "what-like":
            return styles.slotCardWhatLike;
        case "how":
            return styles.slotCardHow;
        default:
            return "";
    }
};

const SLOT_OPTION_BACKGROUND_COLOUR_BY_ID_PREFIX: Record<string, string> = {
    who: "#FF9D2D",
    doing: "#FFEA47",
    what: "#38E87B",
    "to-who": "#FFFFFF",
    where: "#5297FF",
    when: "#B88163",
    "what-like": "#C75EFF",
    how: "#FFBEE5",
};

const getOptionBackgroundColour = (itemId: string) => {
    const matchingPrefix = [...COLOURFUL_SEMANTICS_SLOT_IDS]
        .sort((left, right) => right.length - left.length)
        .find((slotId) => itemId.startsWith(`${slotId}-`));

    return matchingPrefix
        ? SLOT_OPTION_BACKGROUND_COLOUR_BY_ID_PREFIX[matchingPrefix]
        : "#FFFFFF";
};

export const ColourfulSemanticsBoard = ({
    activeStepIndex,
    boardState,
    hideTray = false,
    isVoiceMuted = false,
    itemCorrectnessMap = {},
    isReadOnly = false,
    itemsById,
    onDragEnd,
    scene,
    showAllSlotsVisible = false,
    showFeedback = false,
}: ColourfulSemanticsBoardProps) => {
    const { play } = useAudio();
    const isPluralSubject = getIsPluralSubject({
        itemsById,
        scene,
        selectionIds: boardState.slotItemIds,
    });
    const sensors = [
        PointerSensor.configure({
            activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 1 }),
            ],
        }),
        KeyboardSensor,
    ];

    const playItemSfx = (
        item: ColourfulSemanticsOption,
        slot: ConfiguredColourfulSemanticsScene["steps"][number]["slot"],
    ) => {
        const { sfxUrl } = resolveOptionPresentation({
            item,
            slot,
            isPluralSubject,
        });

        if (!sfxUrl) {
            return;
        }

        if (isVoiceMuted) {
            return;
        }

        play(sfxUrl);
    };

    const renderImage = (
        itemId: string,
        slot: ConfiguredColourfulSemanticsScene["steps"][number]["slot"],
        isLocked = false,
    ) => {
        const item = itemsById[itemId];
        const isCorrect = showFeedback ? itemCorrectnessMap[itemId] : null;
        const presentation = resolveOptionPresentation({
            item,
            slot,
            isPluralSubject,
        });

        return (
            <DraggableImage
                key={itemId}
                id={itemId}
                image={{
                    id: item.id,
                    imageUrl: item.imageUrl,
                    label: presentation.label,
                    sfxUrl: presentation.sfxUrl,
                }}
                isCorrect={isCorrect}
                isSelected={false}
                optionBackgroundColor={getOptionBackgroundColour(itemId)}
                isBorderless={isLocked}
                onClick={() => {
                    playItemSfx(item, slot);
                }}
                onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                        playItemSfx(item, slot);
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
                            const slotMetadata =
                                COLOURFUL_SEMANTICS_SLOT_METADATA[step.slot];
                            const slotTitle =
                                isLocked && slotItemId
                                    ? (resolveOptionPresentation({
                                          item: itemsById[slotItemId],
                                          slot: step.slot,
                                          isPluralSubject,
                                      }).label ?? slotMetadata.label)
                                    : slotMetadata.label;

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
                                                      step.slot,
                                                      isLocked,
                                                  )
                                                : renderPlaceholder(
                                                      slotMetadata.levelIconUrl,
                                                      slotMetadata.levelIconAlt,
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
                        getItemLabel={(itemId) =>
                            resolveOptionPresentation({
                                item: itemsById[itemId],
                                slot:
                                    scene.steps[activeStepIndex]?.slot ??
                                    "doing",
                                isPluralSubject,
                            }).label
                        }
                        itemsById={itemsById}
                        renderItem={(itemId) =>
                            renderImage(
                                itemId,
                                scene.steps[activeStepIndex]?.slot ?? "doing",
                            )
                        }
                    />
                </div>
            </div>
        </DragDropProvider>
    );
};

export default ColourfulSemanticsBoard;
