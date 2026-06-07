/**
 * Categorisation Game
 *
 * Displays the categorisation exercise and handles user interactions.
 * Users drag items from the bottom pool into category boxes.
 */

import type { DragEndEvent } from "@dnd-kit/abstract";
import type { CategorisationItem } from "./types";
import { CategorisationBoard } from "./CategorisationBoard";
import {
    createInitialBoardState,
    moveItem,
    type BoardState,
    type CategoryId,
} from "./boardUtils";
import { useMemo, useState } from "react";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import { useExerciseTracking } from "../../hooks";
import type { ExerciseDifficulty, QuestionState } from "../../lib/types";

interface CategorisationGameProps {
    categories: Record<CategoryId, CategorisationItem[]>;
    categoryTitleImages?: Record<CategoryId, string>;
    isSfxMuted?: boolean;
    onSettingsRequested?: () => void;
}

const EXERCISE_METADATA = {
    id: "categorisation",
    title: "Move the pictures into the matching category",
    instruction: 'Modelling Tip: "Hmmm, is a banana something we eat?"',
};

export const CategorisationGame = ({
    categories,
    categoryTitleImages = {},
    isSfxMuted = false,
    onSettingsRequested,
}: CategorisationGameProps) => {
    const categoryCount = Object.keys(categories).length;
    const totalTileQuestions = useMemo(
        () =>
            Object.values(categories).reduce(
                (total, items) => total + items.length,
                0,
            ),
        [categories],
    );
    const itemsPerCategory =
        categoryCount > 0 ? Math.round(totalTileQuestions / categoryCount) : 0;
    const difficulty: ExerciseDifficulty = {
        level: Math.max(1, categoryCount),
        label: `${categoryCount} categories, ${itemsPerCategory} each`,
    };
    const itemsById = Object.fromEntries(
        Object.values(categories)
            .flat()
            .map((item) => [item.id, item]),
    );

    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const tracking = useExerciseTracking(1);
    const [cumulativeMisplacedTiles, setCumulativeMisplacedTiles] = useState(0);

    const [boardState, setBoardState] = useState<BoardState>(() =>
        createInitialBoardState(categories),
    );

    const handleMoveItem = (itemId: string, targetId: string) => {
        setBoardState((currentBoardState) =>
            moveItem(currentBoardState, itemId, targetId),
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        // Disable dragging if answer has been checked
        if (questionState.answerState !== "notAnswered") {
            return;
        }

        if (event.canceled) {
            return;
        }

        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;

        if (!sourceId || !targetId) {
            return;
        }

        handleMoveItem(String(sourceId), String(targetId));
    };

    const getItemCorrectnessMap = (): Record<string, boolean> => {
        const correctnessMap: Record<string, boolean> = {};

        // For each category, check if items in its slots belong to that category
        Object.entries(categories).forEach(([categoryId, items]) => {
            const categorySlots = boardState.categorySlots[categoryId] || [];
            const itemsInCategory = new Set(
                categorySlots.filter((id) => id !== null),
            );

            // Mark items in this category as correct if they belong to this category
            itemsInCategory.forEach((itemId) => {
                const itemBelongsToCategory = items.some(
                    (item) => item.id === itemId,
                );
                correctnessMap[itemId] = itemBelongsToCategory;
            });
        });

        return correctnessMap;
    };

    const getMisplacedTileCount = () => {
        return Object.entries(boardState.categorySlots).reduce(
            (misplacedCount, [categoryId, slots]) => {
                const allowedItemIds = new Set(
                    (categories[categoryId] || []).map((item) => item.id),
                );

                const misplacedInCategory = slots.reduce(
                    (categoryMisplacedCount, slotItemId) => {
                        if (!slotItemId) {
                            return categoryMisplacedCount;
                        }

                        return allowedItemIds.has(slotItemId)
                            ? categoryMisplacedCount
                            : categoryMisplacedCount + 1;
                    },
                    0,
                );

                return misplacedCount + misplacedInCategory;
            },
            0,
        );
    };

    const onCheckAnswer = () => {
        const misplacedTiles = getMisplacedTileCount();

        if (misplacedTiles > 0) {
            setCumulativeMisplacedTiles((prev) => prev + misplacedTiles);
        }

        // Check if all items are placed in correct categories
        const allCorrect = Object.entries(categories).every(
            ([categoryId, items]) =>
                items.every((item) =>
                    boardState.categorySlots[categoryId].includes(item.id),
                ),
        );

        setQuestionState((prev) => ({
            ...prev,
            answerState: allCorrect ? "correct" : "incorrect",
        }));
    };

    const onResetQuestion = () => {
        setQuestionState({
            selectedIconIds: [],
            answerState: "notAnswered",
        });
    };

    return (
        <ExerciseLayout
            exerciseId={EXERCISE_METADATA.id}
            actionBarPhase={questionState.answerState}
            questions={[
                {
                    id: "1",
                    prompt: "Move the words into the matching category",
                    correctIconIds: ["1"],
                },
            ]}
            tracking={tracking}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetQuestion}
            onSettingsRequested={onSettingsRequested}
            difficulty={difficulty}
            submissionStatsOverride={{
                totalQuestions: totalTileQuestions,
                incorrectAnswers: cumulativeMisplacedTiles,
                attemptsPerQuestion: Array(totalTileQuestions).fill(
                    Math.max(1, tracking.attemptsPerQuestion[0] ?? 0),
                ),
            }}
        >
            <CategorisationBoard
                boardState={boardState}
                itemsById={itemsById}
                categoryTitleImages={categoryTitleImages}
                isSfxMuted={isSfxMuted}
                onDragEnd={handleDragEnd}
                itemCorrectnessMap={
                    questionState.answerState !== "notAnswered"
                        ? getItemCorrectnessMap()
                        : {}
                }
                showFeedback={questionState.answerState !== "notAnswered"}
            />
        </ExerciseLayout>
    );
};

export default CategorisationGame;
