/**
 * Categorisation Board
 * Displays the drag-and-drop board with categories and pool
 */

import type { DragEndEvent } from "@dnd-kit/abstract";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import {
    DragDropProvider,
    KeyboardSensor,
    PointerSensor,
} from "@dnd-kit/react";
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
    onDragEnd,
    itemCorrectnessMap = {},
    showFeedback = false,
}: CategorisationBoardProps) => {
    const { play } = useAudio();
    const sensors = [
        PointerSensor.configure({
            activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 1 }),
            ],
        }),
        KeyboardSensor,
    ];

    const playItemSfx = (item: CategorisationItem) => {
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
            <DragDropProvider sensors={sensors} onDragEnd={onDragEnd}>
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
            </DragDropProvider>
        </div>
    );
};

export default CategorisationBoard;
