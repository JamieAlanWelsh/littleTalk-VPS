import type { DragEndEvent } from "@dnd-kit/abstract";
import { useMemo, useState } from "react";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { Question, QuestionState } from "../../lib/types";
import ColourfulSemanticsBoard from "./ColourfulSemanticsBoard";
import { configureScene } from "./configureScene";
import { getIsPluralSubject, resolveOptionPresentation } from "./presentation";
import {
    createBoardState,
    moveItem,
    type SentenceBoardState,
} from "./boardUtils";
import type {
    ColourfulSemanticsOption,
    ColourfulSemanticsOptions,
    ColourfulSemanticsPayload,
    ColourfulSemanticsScene,
    ConfiguredColourfulSemanticsScene,
} from "./types";

const EXERCISE_ID = "colourful-semantics";

interface ColourfulSemanticsGameProps {
    onSettingsRequested?: () => void;
    onRoundComplete?: () => void;
    onSkipRequested?: () => void;
    options: ColourfulSemanticsOptions;
    payload: ColourfulSemanticsPayload;
    scene: ColourfulSemanticsScene;
    progressBase?: number;
    progressScale?: number;
}

interface ColourfulSemanticsAnswer {
    sceneId: string;
    presetId: ColourfulSemanticsOptions["presetId"];
    numberOfOptions: number;
    stepIds: string[];
}

const buildItemsById = (payload: ColourfulSemanticsPayload) =>
    Object.fromEntries(
        [payload.who, payload.doing, payload.what, payload.where]
            .flat()
            .map((item) => [item.id, item]),
    ) as Record<string, ColourfulSemanticsOption>;

const buildQuestions = (scene: ConfiguredColourfulSemanticsScene): Question[] =>
    scene.steps.map((step) => ({
        id: step.id,
        prompt: step.prompt,
        correctIconIds: [step.correctOptionId],
    }));

const buildAffirmationPrompt = ({
    lockedSelectionIds,
    itemsById,
    scene,
}: {
    lockedSelectionIds: Array<string | null>;
    itemsById: Record<string, ColourfulSemanticsOption>;
    scene: ConfiguredColourfulSemanticsScene;
}) => {
    const isPluralSubject = getIsPluralSubject({
        itemsById,
        scene,
        selectionIds: lockedSelectionIds,
    });

    const sentence = scene.steps
        .map((step, stepIndex) => {
            const selectionId = lockedSelectionIds[stepIndex];

            if (!selectionId) {
                return "";
            }

            const item = itemsById[selectionId];

            if (!item) {
                return "";
            }

            return resolveOptionPresentation({
                item,
                slot: step.slot,
                isPluralSubject,
            }).label;
        })
        .filter(Boolean)
        .join(" ")
        .trim();

    const sentenceWithPunctuation = /[.!?]$/.test(sentence)
        ? sentence
        : `${sentence}.`;

    return sentence
        ? `That's right! ${sentenceWithPunctuation}`
        : "That's right!";
};

const buildCorrectnessMap = ({
    boardState,
    questionState,
    activeStepIndex,
}: {
    boardState: SentenceBoardState;
    questionState: QuestionState;
    activeStepIndex: number;
}) => {
    const correctnessMap: Record<string, boolean> = {};

    const activeSelectionId = boardState.slotItemIds[activeStepIndex];

    if (!activeSelectionId) {
        return correctnessMap;
    }

    if (questionState.answerState === "correct") {
        correctnessMap[activeSelectionId] = true;
    } else if (questionState.answerState === "incorrect") {
        correctnessMap[activeSelectionId] = false;
    }

    return correctnessMap;
};

export const ColourfulSemanticsGame = ({
    onSettingsRequested,
    onRoundComplete,
    onSkipRequested,
    options,
    payload,
    scene: rawScene,
    progressBase,
    progressScale,
}: ColourfulSemanticsGameProps) => {
    const scene = useMemo(
        () =>
            configureScene({
                scene: rawScene,
                options,
            }),
        [options, rawScene],
    );
    const itemsById = useMemo(() => buildItemsById(payload), [payload]);
    const questions = useMemo(() => buildQuestions(scene), [scene]);
    const answers = useMemo(
        () =>
            questions.map(() => ({
                sceneId: scene.id,
                presetId: options.presetId,
                numberOfOptions: options.numberOfOptions,
                stepIds: scene.steps.map((step) => step.id),
            })),
        [options.numberOfOptions, options.presetId, questions, scene],
    );

    const [lockedSelectionIds, setLockedSelectionIds] = useState<
        Array<string | null>
    >(() => scene.steps.map(() => null));
    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const [showCompletionAffirmation, setShowCompletionAffirmation] =
        useState(false);
    const tracking = useExerciseTracking(questions.length);

    const completionAffirmationPrompt = useMemo(
        () =>
            buildAffirmationPrompt({
                lockedSelectionIds,
                itemsById,
                scene,
            }),
        [lockedSelectionIds, itemsById, scene],
    );

    const onCheckAnswer = (question: Question) => {
        const selectedIconId = questionState.selectedIconIds[0];

        if (!selectedIconId) {
            return;
        }

        const questionIndex = questions.findIndex(
            ({ id }) => id === question.id,
        );

        if (questionIndex === -1) {
            return;
        }

        const isCorrect = selectedIconId === question.correctIconIds[0];

        if (isCorrect) {
            setLockedSelectionIds((currentLockedSelectionIds) => {
                const nextLockedSelectionIds = [...currentLockedSelectionIds];
                nextLockedSelectionIds[questionIndex] = selectedIconId;
                return nextLockedSelectionIds;
            });
        }

        setQuestionState((currentQuestionState) => ({
            ...currentQuestionState,
            answerState: isCorrect ? "correct" : "incorrect",
        }));
    };

    const onResetQuestion = () => {
        if (showCompletionAffirmation) {
            return;
        }

        setQuestionState({
            selectedIconIds: [],
            answerState: "notAnswered",
        });
    };

    return (
        <ExerciseLayout<ColourfulSemanticsAnswer>
            exerciseId={EXERCISE_ID}
            actionBarPhase={questionState.answerState}
            answers={answers}
            progressBase={progressBase}
            progressScale={progressScale}
            onCheckAnswer={onCheckAnswer}
            onBeforeContinue={({ isLastQuestion }) => {
                if (
                    isLastQuestion &&
                    !showCompletionAffirmation &&
                    questionState.answerState === "correct"
                ) {
                    setShowCompletionAffirmation(true);
                    return "hold";
                }

                if (isLastQuestion && showCompletionAffirmation) {
                    onRoundComplete?.();
                    return "hold";
                }

                return "proceed";
            }}
            onResetQuestion={onResetQuestion}
            onSettingsRequested={onSettingsRequested}
            promptOverride={
                showCompletionAffirmation
                    ? completionAffirmationPrompt
                    : undefined
            }
            questions={questions}
            showSkip={true}
            onSkipRequested={onSkipRequested}
            tracking={tracking}
        >
            {(_, currentQuestionIndex) => {
                const isFinalAffirmationView =
                    showCompletionAffirmation &&
                    currentQuestionIndex === questions.length - 1;
                const currentSelectionId =
                    questionState.selectedIconIds[0] ?? null;
                const boardState = isFinalAffirmationView
                    ? {
                          poolItemIds: [],
                          slotItemIds: lockedSelectionIds,
                      }
                    : createBoardState({
                          scene,
                          activeStepIndex: currentQuestionIndex,
                          currentSelectionId,
                          lockedSelectionIds,
                      });

                const handleDragEnd = (event: DragEndEvent) => {
                    if (isFinalAffirmationView) {
                        return;
                    }

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

                    const nextBoardState = moveItem({
                        boardState,
                        itemId: String(sourceId),
                        targetId: String(targetId),
                        activeStepIndex: currentQuestionIndex,
                    });

                    const nextSelectionId =
                        nextBoardState.slotItemIds[currentQuestionIndex];

                    setQuestionState((currentQuestionState) => ({
                        ...currentQuestionState,
                        selectedIconIds: nextSelectionId
                            ? [nextSelectionId]
                            : [],
                    }));
                };

                const itemCorrectnessMap = isFinalAffirmationView
                    ? {}
                    : buildCorrectnessMap({
                          boardState,
                          questionState,
                          activeStepIndex: currentQuestionIndex,
                      });

                return (
                    <ColourfulSemanticsBoard
                        activeStepIndex={currentQuestionIndex}
                        boardState={boardState}
                        hideTray={isFinalAffirmationView}
                        isReadOnly={isFinalAffirmationView}
                        itemCorrectnessMap={itemCorrectnessMap}
                        itemsById={itemsById}
                        onDragEnd={handleDragEnd}
                        scene={scene}
                        showAllSlotsVisible={isFinalAffirmationView}
                        showFeedback={
                            questionState.answerState !== "notAnswered"
                        }
                    />
                );
            }}
        </ExerciseLayout>
    );
};

export default ColourfulSemanticsGame;
