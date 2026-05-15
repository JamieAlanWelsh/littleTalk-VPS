import type { DragEndEvent } from "@dnd-kit/abstract";
import { useMemo, useState } from "react";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { Question, QuestionState } from "../../lib/types";
import WhosWhoBoard from "./WhosWhoBoard";
import type { WhosWhoItem, WhosWhoScenario, WhosWhoTarget } from "./types";
import styles from "./WhosWhoGame.module.css";

const EXERCISE_ID = "whos-who";

interface WhosWhoGameProps {
    selectedScenarios: WhosWhoScenario[];
    items: WhosWhoItem[];
    targets: WhosWhoTarget[];
    onSettingsRequested?: () => void;
}

interface RoundState {
    trayItemIds: string[];
    placedItemId: string | null;
    placedTargetId: string | null;
}

interface WhosWhoAnswer {
    scenario: WhosWhoScenario;
    trayItems: WhosWhoItem[];
    targets: WhosWhoTarget[];
}

const buildRoundState = (scenario: WhosWhoScenario): RoundState => ({
    trayItemIds: [scenario.draggableItemId, ...scenario.distractorItemIds],
    placedItemId: null,
    placedTargetId: null,
});

const moveItem = (
    currentRoundState: RoundState,
    itemId: string,
    dropTargetId: string,
): RoundState => {
    const itemIsPlaced = currentRoundState.placedItemId === itemId;
    const nextTrayItemIds = itemIsPlaced
        ? currentRoundState.trayItemIds
        : currentRoundState.trayItemIds.filter(
              (trayItemId) => trayItemId !== itemId,
          );

    if (dropTargetId === "tray") {
        if (!itemIsPlaced) {
            return currentRoundState;
        }

        return {
            trayItemIds: [...nextTrayItemIds, itemId],
            placedItemId: null,
            placedTargetId: null,
        };
    }

    if (!dropTargetId.startsWith("target:")) {
        return currentRoundState;
    }

    const targetId = dropTargetId.replace("target:", "");

    if (itemIsPlaced && currentRoundState.placedTargetId === targetId) {
        return currentRoundState;
    }

    const previousPlacedItemId = currentRoundState.placedItemId;

    return {
        trayItemIds:
            previousPlacedItemId && previousPlacedItemId !== itemId
                ? [...nextTrayItemIds, previousPlacedItemId]
                : nextTrayItemIds,
        placedItemId: itemId,
        placedTargetId: targetId,
    };
};

export const WhosWhoGame = ({
    selectedScenarios,
    items,
    targets,
    onSettingsRequested,
}: WhosWhoGameProps) => {
    const itemById = useMemo(
        () => Object.fromEntries(items.map((item) => [item.id, item])),
        [items],
    );
    const targetById = useMemo(
        () => Object.fromEntries(targets.map((target) => [target.id, target])),
        [targets],
    );

    const questions = useMemo<Question[]>(
        () =>
            selectedScenarios.map((scenario) => ({
                id: scenario.id,
                prompt: scenario.prompt,
                correctIconIds: [scenario.correctTargetId],
            })),
        [selectedScenarios],
    );

    const answers = useMemo<WhosWhoAnswer[]>(
        () =>
            selectedScenarios.map((scenario) => ({
                scenario,
                trayItems: [
                    scenario.draggableItemId,
                    ...scenario.distractorItemIds,
                ]
                    .map((itemId) => itemById[itemId])
                    .filter(Boolean),
                targets: scenario.targetIds
                    .map((targetId) => targetById[targetId])
                    .filter(Boolean),
            })),
        [itemById, selectedScenarios, targetById],
    );

    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const [roundStates, setRoundStates] = useState<RoundState[]>(() =>
        selectedScenarios.map((scenario) => buildRoundState(scenario)),
    );

    const tracking = useExerciseTracking(questions.length);

    const getScenarioIndex = (questionId: string) =>
        selectedScenarios.findIndex((scenario) => scenario.id === questionId);

    const handleDragEnd = (roundIndex: number, event: DragEndEvent) => {
        if (questionState.answerState !== "notAnswered" || event.canceled) {
            return;
        }

        const draggedItemId = event.operation.source?.id;
        const dropTargetId = event.operation.target?.id;

        if (!draggedItemId || !dropTargetId) {
            return;
        }

        setRoundStates((currentRoundStates) => {
            const nextRoundStates = [...currentRoundStates];
            nextRoundStates[roundIndex] = moveItem(
                currentRoundStates[roundIndex],
                String(draggedItemId),
                String(dropTargetId),
            );
            return nextRoundStates;
        });
    };

    const onCheckAnswer = (question: Question) => {
        const roundIndex = getScenarioIndex(question.id);

        if (roundIndex < 0) {
            return;
        }

        const currentRoundState = roundStates[roundIndex];
        const scenario = selectedScenarios[roundIndex];

        if (
            !currentRoundState.placedItemId ||
            !currentRoundState.placedTargetId
        ) {
            return;
        }

        const isCorrect =
            currentRoundState.placedItemId === scenario.draggableItemId &&
            currentRoundState.placedTargetId === scenario.correctTargetId;

        setQuestionState((prev) => ({
            ...prev,
            answerState: isCorrect ? "correct" : "incorrect",
        }));
    };

    const onResetQuestion = () => {
        setQuestionState({
            selectedIconIds: [],
            answerState: "notAnswered",
        });
    };

    return (
        <ExerciseLayout<WhosWhoAnswer>
            exerciseId={EXERCISE_ID}
            actionBarPhase={questionState.answerState}
            questions={questions}
            answers={answers}
            tracking={tracking}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetQuestion}
            onSettingsRequested={onSettingsRequested}
        >
            {(currentAnswer, currentQuestionIndex) => {
                const currentRoundState = roundStates[currentQuestionIndex];

                return (
                    <div className={styles.wrapper}>
                        <WhosWhoBoard
                            answerState={questionState.answerState}
                            currentRoundState={currentRoundState}
                            itemById={itemById}
                            onDragEnd={(event) =>
                                handleDragEnd(currentQuestionIndex, event)
                            }
                            scenario={currentAnswer.scenario}
                            targets={currentAnswer.targets}
                        />
                    </div>
                );
            }}
        </ExerciseLayout>
    );
};

export default WhosWhoGame;
