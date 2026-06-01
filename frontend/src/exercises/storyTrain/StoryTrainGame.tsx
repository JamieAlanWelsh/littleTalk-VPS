import type { DragEndEvent } from "@dnd-kit/abstract";
import { useMemo, useState } from "react";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { Question, QuestionState } from "../../lib/types";
import {
    createInitialBoardState,
    moveItem,
    type BoardState,
} from "./boardUtils";
import StoryTrainBoard from "./StoryTrainBoard";
import type { StoryTrainSet, StoryTrainStep } from "./types";

const EXERCISE_ID = "story-train";

interface StoryTrainGameProps {
    selectedSets: StoryTrainSet[];
}

interface StoryTrainAnswer {
    set: StoryTrainSet;
    itemsById: Record<string, StoryTrainStep>;
}

const buildQuestions = (selectedSets: StoryTrainSet[]): Question[] =>
    selectedSets.map((storySet) => ({
        id: storySet.id,
        prompt: `Can you show me a story about ${storySet.title}`,
        correctIconIds: storySet.steps
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((step) => step.id),
    }));

export const StoryTrainGame = ({ selectedSets }: StoryTrainGameProps) => {
    const questions = useMemo(
        () => buildQuestions(selectedSets),
        [selectedSets],
    );
    const answers = useMemo<StoryTrainAnswer[]>(
        () =>
            selectedSets.map((storySet) => ({
                set: storySet,
                itemsById: Object.fromEntries(
                    storySet.steps.map((step) => [step.id, step]),
                ),
            })),
        [selectedSets],
    );
    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const [boardStates, setBoardStates] = useState<BoardState[]>(() =>
        selectedSets.map((storySet) => createInitialBoardState(storySet)),
    );
    const tracking = useExerciseTracking(questions.length);

    const getQuestionIndex = (questionId: string) =>
        questions.findIndex((question) => question.id === questionId);

    const getItemCorrectnessMap = (questionIndex: number) => {
        const currentBoardState = boardStates[questionIndex];
        const correctItemIds = questions[questionIndex].correctIconIds;
        const correctnessMap: Record<string, boolean> = {};

        currentBoardState.slotItemIds.forEach((itemId, slotIndex) => {
            if (!itemId) {
                return;
            }

            correctnessMap[itemId] = correctItemIds[slotIndex] === itemId;
        });

        return correctnessMap;
    };

    const handleDragEnd = (questionIndex: number, event: DragEndEvent) => {
        if (questionState.answerState !== "notAnswered" || event.canceled) {
            return;
        }

        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;

        if (!sourceId || !targetId) {
            return;
        }

        setBoardStates((currentBoardStates) => {
            const nextBoardStates = [...currentBoardStates];
            nextBoardStates[questionIndex] = moveItem(
                currentBoardStates[questionIndex],
                String(sourceId),
                String(targetId),
            );
            return nextBoardStates;
        });
    };

    const onCheckAnswer = (question: Question) => {
        const questionIndex = getQuestionIndex(question.id);

        if (questionIndex === -1) {
            return;
        }

        const currentBoardState = boardStates[questionIndex];
        const allCorrect = question.correctIconIds.every(
            (itemId, slotIndex) =>
                currentBoardState.slotItemIds[slotIndex] === itemId,
        );

        setQuestionState({
            selectedIconIds: [],
            answerState: allCorrect ? "correct" : "incorrect",
        });
    };

    const onResetQuestion = () => {
        setQuestionState({
            selectedIconIds: [],
            answerState: "notAnswered",
        });
    };

    return (
        <ExerciseLayout<StoryTrainAnswer>
            exerciseId={EXERCISE_ID}
            actionBarPhase={questionState.answerState}
            answers={answers}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetQuestion}
            questions={questions}
            tracking={tracking}
        >
            {(currentAnswer, currentQuestionIndex) => (
                <StoryTrainBoard
                    boardState={boardStates[currentQuestionIndex]}
                    itemsById={currentAnswer.itemsById}
                    itemCorrectnessMap={
                        questionState.answerState !== "notAnswered"
                            ? getItemCorrectnessMap(currentQuestionIndex)
                            : {}
                    }
                    onDragEnd={(event) =>
                        handleDragEnd(currentQuestionIndex, event)
                    }
                    showFeedback={questionState.answerState !== "notAnswered"}
                />
            )}
        </ExerciseLayout>
    );
};

export default StoryTrainGame;
