import type { StoryTrainSet } from "./types";

export type ItemId = string;

export const POOL_ID = "pool";

export interface BoardState {
    poolItemIds: ItemId[];
    slotItemIds: Array<ItemId | null>;
}

type ItemLocation = { type: "pool" } | { type: "slot"; slotIndex: number };

const shuffle = <T>(items: T[]): T[] => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [
            shuffled[swapIndex],
            shuffled[index],
        ];
    }

    return shuffled;
};

export const createInitialBoardState = (
    storySet: StoryTrainSet,
): BoardState => ({
    poolItemIds: shuffle(storySet.steps.map((step) => step.id)),
    slotItemIds: Array.from({ length: storySet.steps.length }, () => null),
});

export const parseSlotId = (targetId: string) => {
    const [prefix, slotIndex] = targetId.split(":");

    if (prefix !== "slot" || slotIndex == null) {
        return null;
    }

    const parsedSlotIndex = Number(slotIndex);

    if (Number.isNaN(parsedSlotIndex)) {
        return null;
    }

    return parsedSlotIndex;
};

const findItemLocation = (
    boardState: BoardState,
    itemId: ItemId,
): ItemLocation | null => {
    if (boardState.poolItemIds.includes(itemId)) {
        return { type: "pool" };
    }

    const slotIndex = boardState.slotItemIds.findIndex(
        (slotItemId) => slotItemId === itemId,
    );

    if (slotIndex !== -1) {
        return {
            type: "slot",
            slotIndex,
        };
    }

    return null;
};

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
        nextBoardState.slotItemIds[sourceLocation.slotIndex] = null;
        nextBoardState.poolItemIds.unshift(itemId);
        return nextBoardState;
    }

    const targetSlotIndex = parseSlotId(targetId);

    if (targetSlotIndex == null) {
        return boardState;
    }

    if (
        sourceLocation.type === "slot" &&
        sourceLocation.slotIndex === targetSlotIndex
    ) {
        return boardState;
    }

    if (
        targetSlotIndex < 0 ||
        targetSlotIndex >= boardState.slotItemIds.length
    ) {
        return boardState;
    }

    const nextBoardState = structuredClone(boardState);
    const displacedItemId = nextBoardState.slotItemIds[targetSlotIndex];

    if (sourceLocation.type === "pool") {
        const poolIndex = nextBoardState.poolItemIds.indexOf(itemId);
        if (poolIndex !== -1) {
            nextBoardState.poolItemIds.splice(poolIndex, 1);
        }
    } else {
        nextBoardState.slotItemIds[sourceLocation.slotIndex] = null;
    }

    nextBoardState.slotItemIds[targetSlotIndex] = itemId;

    if (displacedItemId && displacedItemId !== itemId) {
        if (sourceLocation.type === "slot") {
            nextBoardState.slotItemIds[sourceLocation.slotIndex] =
                displacedItemId;
        } else {
            nextBoardState.poolItemIds.push(displacedItemId);
        }
    }

    return nextBoardState;
};
