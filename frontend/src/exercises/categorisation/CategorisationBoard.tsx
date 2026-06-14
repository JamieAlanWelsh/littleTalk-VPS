/**
 * Categorisation Board
 * Displays the drag-and-drop board with categories and pool
 */

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
import { CategoryBox } from "../../components/CategoryBox/CategoryBox";
import { DraggableImage } from "../../components/DraggableImage/DraggableImage";
import { PoolTray } from "../../components/PoolTray/PoolTray";
import useAudio from "../../hooks/useAudio";
import type { CategorisationItem } from "./types";
import type { BoardState } from "./boardUtils";

interface CategorisationBoardProps {
    boardState: BoardState;
    itemsById: Record<string, CategorisationItem>;
    categoryTitleImages?: Record<string, string>;
    isSfxMuted?: boolean;
    onDragEnd: (event: DragEndEvent) => void;
    itemCorrectnessMap?: Record<string, boolean>;
    showFeedback?: boolean;
}

const CATEGORY_BORDER_COLORS = ["#ff6b6b", "#4cc75f", "#5b8def", "#f5a524"];

const formatCategoryLabel = (categoryId: string) =>
    categoryId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export const CategorisationBoard = ({
    boardState,
    itemsById,
    categoryTitleImages = {},
    isSfxMuted = false,
    onDragEnd,
    itemCorrectnessMap = {},
    showFeedback = false,
}: CategorisationBoardProps) => {
    const { play } = useAudio();
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 1 },
        }),
        useSensor(KeyboardSensor),
    );

    const playItemSfx = (item: CategorisationItem) => {
        if (isSfxMuted || !item.sfxUrl) {
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
                image={item}
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
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
            }}
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
                <div
                    style={{
                        display: "flex",
                        gap: "1.5rem",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {Object.entries(boardState.categorySlots).map(
                        ([categoryId, slots], index) => (
                            <CategoryBox
                                key={categoryId}
                                categoryId={categoryId}
                                title={formatCategoryLabel(categoryId)}
                                titleImageUrl={categoryTitleImages[categoryId]}
                                slotCount={slots.length}
                                borderColor={
                                    CATEGORY_BORDER_COLORS[
                                        index % CATEGORY_BORDER_COLORS.length
                                    ]
                                }
                                renderSlot={(_, slotIndex) => {
                                    const itemId = slots[slotIndex];
                                    return itemId ? renderImage(itemId) : null;
                                }}
                            />
                        ),
                    )}
                </div>
                <PoolTray
                    id="pool"
                    itemIds={boardState.poolItemIds}
                    renderItem={renderImage}
                    itemsById={itemsById}
                />
            </DndContext>
        </div>
    );
};

export default CategorisationBoard;
