import type { ColourfulSemanticsScene } from "./types";

export type ItemId = string;

export const POOL_ID = "pool";

export interface SentenceBoardState {
    poolItemIds: ItemId[];
    slotItemIds: Array<ItemId | null>;
}

type ItemLocation = { type: "pool" } | { type: "slot"; slotIndex: number };

export const getSlotId = (slotIndex: number) => `slot:${slotIndex}`;

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

export const findItemLocation = (
    boardState: SentenceBoardState,
    itemId: ItemId,
): ItemLocation | null => {
    if (boardState.poolItemIds.includes(itemId)) {
        return { type: "pool" };
    }

    const slotIndex = boardState.slotItemIds.findIndex(
        (slotItemId) => slotItemId === itemId,
    );

    if (slotIndex === -1) {
        return null;
    }

    return {
        type: "slot",
        slotIndex,
    };
};

export const createBoardState = ({
    scene,
    activeStepIndex,
    currentSelectionId,
    lockedSelectionIds,
}: {
    scene: ColourfulSemanticsScene;
    activeStepIndex: number;
    currentSelectionId: string | null;
    lockedSelectionIds: Array<string | null>;
}): SentenceBoardState => {
    const activeStep = scene.steps[activeStepIndex];

    return {
        poolItemIds: activeStep.optionIds.filter(
            (optionId) => optionId !== currentSelectionId,
        ),
        slotItemIds: scene.steps.map((_, stepIndex) => {
            if (stepIndex < activeStepIndex) {
                return lockedSelectionIds[stepIndex] ?? null;
            }

            if (stepIndex === activeStepIndex) {
                return currentSelectionId;
            }

            return null;
        }),
    };
};

export const moveItem = ({
    boardState,
    itemId,
    targetId,
    activeStepIndex,
}: {
    boardState: SentenceBoardState;
    itemId: ItemId;
    targetId: string;
    activeStepIndex: number;
}): SentenceBoardState => {
    const sourceLocation = findItemLocation(boardState, itemId);

    if (!sourceLocation) {
        return boardState;
    }

    const activeSlotIndex = activeStepIndex;

    if (targetId === POOL_ID) {
        if (
            sourceLocation.type !== "slot" ||
            sourceLocation.slotIndex !== activeSlotIndex
        ) {
            return boardState;
        }

        const nextBoardState = structuredClone(boardState);
        nextBoardState.slotItemIds[activeSlotIndex] = null;
        nextBoardState.poolItemIds.unshift(itemId);
        return nextBoardState;
    }

    const targetSlotIndex = parseSlotId(targetId);

    if (targetSlotIndex == null || targetSlotIndex !== activeSlotIndex) {
        return boardState;
    }

    if (
        sourceLocation.type === "slot" &&
        sourceLocation.slotIndex === targetSlotIndex
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
        nextBoardState.poolItemIds.unshift(displacedItemId);
    }

    return nextBoardState;
};
