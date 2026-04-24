/**
 * Categorisation Game
 *
 * Displays the categorisation exercise and handles user interactions.
 * Users drag items from the bottom pool into category boxes.
 */

import { useState } from "react";
import type { DragEndEvent } from "@dnd-kit/abstract";
import type {
    CategorisationExercisePayload,
    CategorisationOptions,
    CategorisationItem,
} from "./types";
import { DragDropProvider } from "@dnd-kit/react";
import { CategoryBox } from "../../components/CategoryBox/CategoryBox";
import { DraggableImage } from "../../components/DraggableImage/DraggableImage";
import { PoolTray } from "../../components/PoolTray/PoolTray";

interface CategorisationGameProps {
    payload: CategorisationExercisePayload;
    options: CategorisationOptions;
}

type ItemId = string;
type CategoryId = string;

const POOL_ID = "pool";

interface BoardState {
    poolItemIds: ItemId[];
    categorySlots: Record<CategoryId, Array<ItemId | null>>;
}

type ItemLocation =
    | { type: "pool" }
    | { type: "slot"; categoryId: CategoryId; slotIndex: number };

const createInitialBoardState = (
    categories: Record<CategoryId, CategorisationItem[]>,
): BoardState => ({
    poolItemIds: Object.values(categories)
        .flat()
        .map((item) => item.id),

    categorySlots: Object.fromEntries(
        Object.entries(categories).map(([categoryId, items]) => [
            categoryId,
            Array.from({ length: items.length }, () => null),
        ]),
    ),
});

const formatCategoryLabel = (categoryId: string) =>
    categoryId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const CATEGORY_BORDER_COLORS = ["#ff6b6b", "#4cc75f", "#5b8def", "#f5a524"];

const parseSlotId = (targetId: string) => {
    const [prefix, categoryId, slotIndex] = targetId.split(":");

    if (prefix !== "slot" || !categoryId || slotIndex == null) {
        return null;
    }

    const parsedSlotIndex = Number(slotIndex);

    if (Number.isNaN(parsedSlotIndex)) {
        return null;
    }

    return {
        categoryId,
        slotIndex: parsedSlotIndex,
    };
};

const findItemLocation = (
    boardState: BoardState,
    itemId: ItemId,
): ItemLocation | null => {
    if (boardState.poolItemIds.includes(itemId)) {
        return { type: "pool" };
    }

    for (const [categoryId, slots] of Object.entries(
        boardState.categorySlots,
    )) {
        const slotIndex = slots.findIndex(
            (slotItemId) => slotItemId === itemId,
        );

        if (slotIndex !== -1) {
            return {
                type: "slot",
                categoryId,
                slotIndex,
            };
        }
    }

    return null;
};

const moveItem = (
    boardState: BoardState,
    itemId: ItemId,
    targetId: string,
): BoardState => {
    const sourceLocation = findItemLocation(boardState, itemId);

    if (!sourceLocation) {
        return boardState;
    }

    if (targetId === POOL_ID) {
        if (sourceLocation.type === "pool") {
            return boardState;
        }

        const nextCategorySlots = Object.fromEntries(
            Object.entries(boardState.categorySlots).map(
                ([categoryId, slots]) => [categoryId, [...slots]],
            ),
        ) as BoardState["categorySlots"];

        nextCategorySlots[sourceLocation.categoryId][sourceLocation.slotIndex] =
            null;

        return {
            poolItemIds: [...boardState.poolItemIds, itemId],
            categorySlots: nextCategorySlots,
        };
    }

    const targetSlot = parseSlotId(targetId);

    if (!targetSlot) {
        return boardState;
    }

    if (
        sourceLocation.type === "slot" &&
        sourceLocation.categoryId === targetSlot.categoryId &&
        sourceLocation.slotIndex === targetSlot.slotIndex
    ) {
        return boardState;
    }

    const nextPoolItemIds = [...boardState.poolItemIds];
    const nextCategorySlots = Object.fromEntries(
        Object.entries(boardState.categorySlots).map(([categoryId, slots]) => [
            categoryId,
            [...slots],
        ]),
    ) as BoardState["categorySlots"];

    const displacedItemId =
        nextCategorySlots[targetSlot.categoryId]?.[targetSlot.slotIndex] ??
        null;

    if (sourceLocation.type === "pool") {
        const poolIndex = nextPoolItemIds.indexOf(itemId);

        if (poolIndex !== -1) {
            nextPoolItemIds.splice(poolIndex, 1);
        }
    } else {
        nextCategorySlots[sourceLocation.categoryId][sourceLocation.slotIndex] =
            null;
    }

    nextCategorySlots[targetSlot.categoryId][targetSlot.slotIndex] = itemId;

    if (displacedItemId && displacedItemId !== itemId) {
        if (sourceLocation.type === "slot") {
            nextCategorySlots[sourceLocation.categoryId][
                sourceLocation.slotIndex
            ] = displacedItemId;
        } else {
            nextPoolItemIds.push(displacedItemId);
        }
    }

    return {
        poolItemIds: nextPoolItemIds,
        categorySlots: nextCategorySlots,
    };
};

export const CategorisationGame = ({
    payload,
    options,
}: CategorisationGameProps) => {
    const selectedCategories = Object.fromEntries(
        Object.entries(payload.categories).filter(([categoryId]) =>
            options.selectedCategoryIds.includes(categoryId),
        ),
    );
    const itemsById = Object.fromEntries(
        Object.values(selectedCategories)
            .flat()
            .map((item) => [item.id, item]),
    );
    const [boardState, setBoardState] = useState<BoardState>(() =>
        createInitialBoardState(selectedCategories),
    );

    const renderImage = (itemId: string) => (
        <DraggableImage
            key={itemId}
            id={itemId}
            image={itemsById[itemId]}
            isCorrect={null}
            isSelected={false}
            onClick={() => {}}
        />
    );

    const handleDragEnd = (event: DragEndEvent) => {
        if (event.canceled) {
            return;
        }

        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;

        if (!sourceId || !targetId) {
            return;
        }

        setBoardState((currentBoardState) =>
            moveItem(currentBoardState, String(sourceId), String(targetId)),
        );
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "2rem",
                gap: "1.5rem",
            }}
        >
            <DragDropProvider onDragEnd={handleDragEnd}>
                <div
                    style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}
                >
                    {Object.entries(boardState.categorySlots).map(
                        ([categoryId, slots], index) => (
                            <CategoryBox
                                key={categoryId}
                                categoryId={categoryId}
                                title={formatCategoryLabel(categoryId)}
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
                    title="Word Bank"
                    renderItem={renderImage}
                />
            </DragDropProvider>
        </div>

        // <DragDropProvider>

        //   <ExerciseLayout<SentaceToImageMatchingAnswer>
        //     exerciseId={EXERCISE_METADATA.id}
        //     actionBarPhase={'notAnswered'}
        //     questions={[{id: "question1", prompt: 'Drag and drop baby', correctIconIds: []}]}
        //     answers={payload.categories['clothing'].map((item) => ({ options: [item] }))}
        //     tracking={tracking}
        //     onCheckAnswer={onCheckAnswer}
        //     onResetQuestion={console.log('reset question')}
        //   >
        //     {(currentAnswer: SentaceToImageMatchingAnswer) => (
        //       <>
        //             <ImageOption
        //               image={hat?.imageUrl}
        //               ref={ref}
        //               isCorrect={
        //                 questionState.answerState === "correct"
        //                   ? true
        //                   : questionState.answerState === "incorrect"
        //                     ? false
        //                     : null
        //               }
        //               isSelected={questionState.selectedIconIds.includes(hat.id)}
        //               isDisabled={
        //                 questionState.answerState !== "notAnswered" &&
        //                 !questionState.selectedIconIds.includes(hat.id)
        //               }
        //               onClick={() =>
        //                 setQuestionState((prev) => ({
        //                   ...prev,
        //                   selectedIconIds: [hat.id],
        //                 }))
        //               }
        //               />
        //       </>
        //     )}
        //   </ExerciseLayout>

        // </DragDropProvider>
    );
};

export default CategorisationGame;
