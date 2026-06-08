/**
 * Board Utility Functions
 * Pure functions for managing categorisation board state and logic
 */

import type { CategorisationItem } from "./types";

export type ItemId = string;
export type CategoryId = string;

export const POOL_ID = "pool";

export interface BoardState {
    poolItemIds: ItemId[];
    categorySlots: Record<CategoryId, Array<ItemId | null>>;
}

export type ItemLocation =
    | { type: "pool" }
    | { type: "slot"; categoryId: CategoryId; slotIndex: number };

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffle = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Create initial board state from categories
 */
export const createInitialBoardState = (
    categories: Record<CategoryId, CategorisationItem[]>,
): BoardState => ({
    poolItemIds: shuffle(
        Object.values(categories)
            .flat()
            .map((item) => item.id),
    ),

    categorySlots: Object.fromEntries(
        Object.entries(categories).map(([categoryId, items]) => [
            categoryId,
            Array.from({ length: items.length }, () => null),
        ]),
    ),
});

/**
 * Parse slot ID into category ID and slot index
 */
export const parseSlotId = (targetId: string) => {
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

/**
 * Find where an item is located on the board
 */
export const findItemLocation = (
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

/**
 * Move an item from one location to another
 */
export const moveItem = (
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

        const nextBoardState = structuredClone(boardState);

        nextBoardState.categorySlots[sourceLocation.categoryId][
            sourceLocation.slotIndex
        ] = null;
        nextBoardState.poolItemIds.unshift(itemId);

        return nextBoardState;
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

    const nextBoardState = structuredClone(boardState);

    const targetSlots = nextBoardState.categorySlots[targetSlot.categoryId];

    if (
        !targetSlots ||
        targetSlot.slotIndex < 0 ||
        targetSlot.slotIndex >= targetSlots.length
    ) {
        return boardState;
    }

    const displacedItemId = targetSlots[targetSlot.slotIndex];

    if (sourceLocation.type === "pool") {
        const poolIndex = nextBoardState.poolItemIds.indexOf(itemId);

        if (poolIndex !== -1) {
            nextBoardState.poolItemIds.splice(poolIndex, 1);
        }
    } else {
        nextBoardState.categorySlots[sourceLocation.categoryId][
            sourceLocation.slotIndex
        ] = null;
    }

    targetSlots[targetSlot.slotIndex] = itemId;

    if (displacedItemId && displacedItemId !== itemId) {
        if (sourceLocation.type === "slot") {
            nextBoardState.categorySlots[sourceLocation.categoryId][
                sourceLocation.slotIndex
            ] = displacedItemId;
        } else {
            nextBoardState.poolItemIds.push(displacedItemId);
        }
    }

    return nextBoardState;
};
