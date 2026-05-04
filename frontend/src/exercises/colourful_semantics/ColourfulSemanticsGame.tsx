import type { DragEndEvent } from "@dnd-kit/abstract";
import { useMemo, useState } from "react";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { Question, QuestionState } from "../../lib/types";
import ColourfulSemanticsBoard from "./ColourfulSemanticsBoard";
import {
    buildFlatQuestions,
    resolveQuestionLocation,
    type SceneQuestions,
} from "./buildSceneQuestions";
import {
    createBoardState,
    moveItem,
    type SentenceBoardState,
} from "./boardUtils";
import type {
    ColourfulSemanticsOption,
    ColourfulSemanticsPayload,
} from "./types";

const EXERCISE_ID = "colourful-semantics";

interface ColourfulSemanticsGameProps {
    onSettingsRequested?: () => void;
    sceneQuestionsList: SceneQuestions[];
    payload: ColourfulSemanticsPayload;
}

interface ColourfulSemanticsAnswer {
    boardState: SentenceBoardState;
    scene: SceneQuestions["scene"];
    itemsById: Record<string, ColourfulSemanticsOption>;
    activeStepIndex: number;
    isAffirmation: boolean;
    itemCorrectnessMap: Record<string, boolean>;
}

const buildItemsById = (
    payload: ColourfulSemanticsPayload,
): Record<string, ColourfulSemanticsOption> =>
    Object.fromEntries(
        [payload.who, payload.doing, payload.what, payload.where]
            .flat()
            .map((item) => [item.id, item]),
    );

export const ColourfulSemanticsGame = ({
    onSettingsRequested,
    sceneQuestionsList,
    payload,
}: ColourfulSemanticsGameProps) => {
    const itemsById = useMemo(() => buildItemsById(payload), [payload]);

    // Flat Question[] for ExerciseLayout — static for the lifetime of this game.
    const flatQuestions = useMemo(
        () => buildFlatQuestions(sceneQuestionsList),
        [sceneQuestionsList],
    );

    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });

    const tracking = useExerciseTracking(flatQuestions.length);

    // Derive the answers array ExerciseLayout renders. Recomputes when the
    // player locks a correct answer or selects a new option.
    const answers = useMemo((): ColourfulSemanticsAnswer[] => {
        return flatQuestions.map((_, flatIndex) => {
            const location = resolveQuestionLocation(
                sceneQuestionsList,
                flatIndex,
            );

            if (location.type === "affirmation") {
                // Show full sentence with all correct answers locked in.
                const { scene } = location.sceneQuestions;
                return {
                    boardState: {
                        poolItemIds: [],
                        slotItemIds: scene.steps.map(
                            (step) => step.correctOptionId,
                        ),
                    },
                    scene,
                    itemsById,
                    activeStepIndex: scene.steps.length - 1,
                    isAffirmation: true,
                    itemCorrectnessMap: {},
                };
            }

            const { sceneQuestions, stepIndex } = location;
            const { scene } = sceneQuestions;

            // Previous steps are always correct (only correct answers advance),
            // so we derive locked selections directly from the scene data.
            const lockedSelectionIds = scene.steps.map((step, i) =>
                i < stepIndex ? step.correctOptionId : null,
            );

            const currentSelectionId = questionState.selectedIconIds[0] ?? null;

            const boardState = createBoardState({
                scene,
                activeStepIndex: stepIndex,
                currentSelectionId,
                lockedSelectionIds,
            });

            const activeSelectionId = boardState.slotItemIds[stepIndex];
            const itemCorrectnessMap: Record<string, boolean> = {};
            if (activeSelectionId) {
                if (questionState.answerState === "correct") {
                    itemCorrectnessMap[activeSelectionId] = true;
                } else if (questionState.answerState === "incorrect") {
                    itemCorrectnessMap[activeSelectionId] = false;
                }
            }

            return {
                boardState,
                scene,
                itemsById,
                activeStepIndex: stepIndex,
                isAffirmation: false,
                itemCorrectnessMap,
            };
        });
    }, [flatQuestions, sceneQuestionsList, questionState, itemsById]);

    const onCheckAnswer = (question: Question) => {
        const selectedIconId = questionState.selectedIconIds[0];
        if (!selectedIconId) return;

        const isCorrect = question.correctIconIds[0] === selectedIconId;

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

    const handleDragEnd = (
        event: DragEndEvent,
        currentAnswer: ColourfulSemanticsAnswer,
    ) => {
        if (currentAnswer.isAffirmation) return;
        if (questionState.answerState !== "notAnswered") return;
        if (event.canceled) return;

        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;
        if (!sourceId || !targetId) return;

        const nextBoardState = moveItem({
            boardState: currentAnswer.boardState,
            itemId: String(sourceId),
            targetId: String(targetId),
            activeStepIndex: currentAnswer.activeStepIndex,
        });

        const nextSelectionId =
            nextBoardState.slotItemIds[currentAnswer.activeStepIndex];

        setQuestionState((prev) => ({
            ...prev,
            selectedIconIds: nextSelectionId ? [nextSelectionId] : [],
        }));
    };

    return (
        <ExerciseLayout<ColourfulSemanticsAnswer>
            exerciseId={EXERCISE_ID}
            actionBarPhase={questionState.answerState}
            answers={answers}
            questions={flatQuestions}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetQuestion}
            onSettingsRequested={onSettingsRequested}
            onBeforeContinue={({ currentQuestionIndex }) => {
                const location = resolveQuestionLocation(
                    sceneQuestionsList,
                    currentQuestionIndex,
                );
                // At an affirmation question, reset state for the next scene.
                if (location.type === "affirmation") {
                    setQuestionState({
                        selectedIconIds: [],
                        answerState: "correct",
                    });
                }
                return "proceed";
            }}
            showSkip={true}
            tracking={tracking}
        >
            {(
                currentAnswer: ColourfulSemanticsAnswer,
                currentQuestionIndex,
            ) => (
                <ColourfulSemanticsBoard
                    activeStepIndex={currentAnswer.activeStepIndex}
                    boardState={currentAnswer.boardState}
                    hideTray={currentAnswer.isAffirmation}
                    isReadOnly={currentAnswer.isAffirmation}
                    itemCorrectnessMap={currentAnswer.itemCorrectnessMap}
                    itemsById={currentAnswer.itemsById}
                    onDragEnd={(event) => handleDragEnd(event, currentAnswer)}
                    scene={currentAnswer.scene}
                    showAllSlotsVisible={currentAnswer.isAffirmation}
                    showFeedback={
                        !currentAnswer.isAffirmation &&
                        questionState.answerState !== "notAnswered"
                    }
                    key={currentQuestionIndex}
                />
            )}
        </ExerciseLayout>
    );
};

export default ColourfulSemanticsGame;
