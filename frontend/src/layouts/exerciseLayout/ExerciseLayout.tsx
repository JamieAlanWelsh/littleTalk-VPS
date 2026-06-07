/**
 * ExerciseLayout Component
 *
 * Generic exercise container that wraps the exercise content.
 * Provides a consistent UX pattern for all exercises built with the framework.
 *
 * The layout now expects exercises to manage their own zones (prompt, interactables, actions)
 * and feedback/progress indicators internally.
 */

import { useEffect, useState, type ReactNode } from "react";
import styles from "./exerciseLayout.module.css";
import ExerciseActionBar from "../../components/ExerciseActionBar/ExerciseActionBar";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import type { AnswerState, Question } from "../../lib/types";
import { useExerciseTracking, useSubmitExerciseResult } from "../../hooks";
import ExerciseEndscreen from "../exerciseEndscreen/ExerciseEndscreen";
import { useAudio } from "../../hooks/useAudio";

const EXP_FLOOR = 200;
const EXP_ACCURACY_RANGE = 80; // accuracy contributes 0–80
const EXP_JITTER_RANGE = 20; // jitter contributes 0–20

const formatElapsedTime = (startedAt: string, completedAt: string): string => {
    const totalSeconds = Math.max(
        0,
        Math.round(
            (new Date(completedAt).getTime() - new Date(startedAt).getTime()) /
                1000,
        ),
    );
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
};

const correctFeedbackMessages = [
    "Great job! That's correct.",
    "Well done! You got it right.",
];

const incorrectFeedbackMessages = [
    "Not quite, try again!",
    "Almost there, give it another try!",
];

interface ExerciseLayoutProps<AnswerType> {
    exerciseId: string;
    actionBarPhase: AnswerState;
    questions: Question[];
    answers?: AnswerType[]; // Optional, for exercises that want to pass pre-processed answer data
    tracking: ReturnType<typeof useExerciseTracking>;
    onCheckAnswer: (question: Question) => void;
    onResetQuestion: () => void;
    onBeforeContinue?: (params: {
        currentQuestionIndex: number;
        isLastQuestion: boolean;
    }) => "proceed" | "hold";
    onSettingsRequested?: () => void;
    promptOverride?: string;
    disableCheck?: boolean;
    showSkip?: boolean;
    onSkipRequested?: () => void;
    /** 0–1 fraction already completed before this round starts. Default: 0. */
    progressBase?: number;
    /** Fraction of total that one round occupies. Default: 1. */
    progressScale?: number;
    /** Optional submit payload metric overrides for session-level exercises. */
    submissionStatsOverride?: {
        startedAt?: string;
        totalQuestions?: number;
        incorrectAnswers?: number;
        attemptsPerQuestion?: number[];
    };
    children:
        | ReactNode
        | ((
              currentAnswer: AnswerType,
              currentAnswerIndex: number,
          ) => ReactNode);
}

export const ExerciseLayout = <AnswerType,>({
    exerciseId,
    actionBarPhase,
    questions,
    answers,
    tracking,
    onCheckAnswer,
    onResetQuestion,
    onBeforeContinue,
    onSettingsRequested,
    promptOverride,
    disableCheck = false,
    showSkip = true,
    onSkipRequested,
    progressBase = 0,
    progressScale = 1,
    submissionStatsOverride,
    children,
}: ExerciseLayoutProps<AnswerType>) => {
    const [currentQuestionStateIndex, setCurrentQuestionStateIndex] =
        useState<number>(0);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [showSettingsConfirmation, setShowSettingsConfirmation] =
        useState(false);
    const [endscreenMetrics, setEndscreenMetrics] = useState<{
        expGained: number;
        accuracyPercent: number;
        elapsedTimeLabel: string;
    } | null>(null);
    const submitExerciseMutation = useSubmitExerciseResult();

    const progress =
        progressBase +
        progressScale * (currentQuestionStateIndex / questions.length);
    const isComplete = currentQuestionStateIndex === questions.length;
    const isLastQuestion = currentQuestionStateIndex === questions.length - 1;
    const currentQuestion = questions[currentQuestionStateIndex];
    const promptText = promptOverride ?? currentQuestion?.prompt ?? "";

    const { play } = useAudio();

    useEffect(() => {
        if (actionBarPhase === "correct") play("/static/audio/correct.wav");
        else if (actionBarPhase === "incorrect")
            play("/static/audio/incorrect.wav");
    }, [actionBarPhase]);

    const feedbackMessage =
        actionBarPhase === "correct"
            ? correctFeedbackMessages[
                  Math.floor(Math.random() * correctFeedbackMessages.length)
              ]
            : actionBarPhase === "incorrect"
              ? incorrectFeedbackMessages[
                    Math.floor(Math.random() * incorrectFeedbackMessages.length)
                ]
              : "";

    const submitExerciseResults = () => {
        const completedAt = new Date().toISOString();
        const startedAt =
            submissionStatsOverride?.startedAt ?? tracking.startedAt;
        const attemptsPerQuestion =
            submissionStatsOverride?.attemptsPerQuestion ??
            tracking.attemptsPerQuestion;
        const totalQuestions =
            submissionStatsOverride?.totalQuestions ?? questions.length;
        const incorrectAnswers =
            submissionStatsOverride?.incorrectAnswers ??
            tracking.incorrectAnswers;

        const accuracyRatio =
            totalQuestions > 0
                ? Math.max(0, totalQuestions - incorrectAnswers) /
                  totalQuestions
                : 1;
        const accuracyPercent = Math.max(0, Math.round(accuracyRatio * 100));
        const accuracyComponent = Math.round(
            accuracyRatio * EXP_ACCURACY_RANGE,
        );
        const jitter = Math.floor(Math.random() * (EXP_JITTER_RANGE + 1));
        const exp = EXP_FLOOR + accuracyComponent + jitter;
        const elapsedTimeLabel = formatElapsedTime(startedAt, completedAt);

        setEndscreenMetrics({
            expGained: exp,
            accuracyPercent,
            elapsedTimeLabel,
        });

        submitExerciseMutation.mutate({
            nonce: `${Date.now()}-${Math.random()}`,
            exp,
            totalExercises: 1,
            exerciseId: exerciseId,
            difficultySelected: "medium",
            startedAt,
            completedAt,
            totalQuestions,
            incorrectAnswers,
            attemptsPerQuestion,
        });
    };

    const onContinue = () => {
        const continueDecision = onBeforeContinue?.({
            currentQuestionIndex: currentQuestionStateIndex,
            isLastQuestion,
        });

        if (continueDecision === "hold") {
            return;
        }

        setCurrentQuestionStateIndex((prev) => prev + 1);
        if (isLastQuestion) {
            submitExerciseResults();
        } else {
            onResetQuestion();
        }
    };

    const onSkip = () => {
        tracking.incrementSkips();
        if (onSkipRequested) {
            onSkipRequested();
        } else {
            onContinue();
        }
    };

    const onTryAgain = () => {
        onResetQuestion();
    };

    const handleEndSession = () => {
        window.location.href = "/practise/";
    };

    return (
        <>
            {isComplete ? (
                <div className={styles.exerciseLayoutWrapper}>
                    <ExerciseEndscreen
                        expGained={endscreenMetrics?.expGained ?? EXP_FLOOR}
                        accuracyPercent={
                            endscreenMetrics?.accuracyPercent ?? 100
                        }
                        elapsedTimeLabel={
                            endscreenMetrics?.elapsedTimeLabel ?? "—"
                        }
                        onReturnHome={handleEndSession}
                    />
                </div>
            ) : (
                <>
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressBarContent}>
                            <button
                                className={styles.exitButton}
                                onClick={() => {
                                    setShowExitConfirmation(true);
                                }}
                                title="Exit exercise"
                                type="button"
                            >
                                ✕
                            </button>
                            <div className={styles.progressBarInner}>
                                <div
                                    className={styles.progressBarFill}
                                    style={{ width: `${progress * 100}%` }}
                                ></div>
                            </div>
                            {onSettingsRequested ? (
                                <button
                                    className={styles.settingsButton}
                                    onClick={() =>
                                        setShowSettingsConfirmation(true)
                                    }
                                    title="Exercise settings"
                                    type="button"
                                >
                                    ⚙
                                </button>
                            ) : (
                                <div
                                    className={styles.progressBarButtonSpacer}
                                    aria-hidden="true"
                                ></div>
                            )}
                        </div>
                    </div>

                    <div className={styles.exerciseLayoutWrapper}>
                        {/* question */}
                        <div
                            key={`${questions[currentQuestionStateIndex].id}-${promptOverride ?? ""}`}
                            className={`${styles.exercisePromptCard} ${styles.exercisePromptCardPop}`}
                        >
                            <h2 className={styles.exercisePromptTitle}>
                                <span className={styles.exercisePromptText}>
                                    {promptText}
                                </span>
                            </h2>
                        </div>

                        {/* answer */}
                        <div className={styles.exerciseContainer}>
                            <div
                                className={`${styles.exerciseZone} ${styles.exerciseZoneInteractive}`}
                            >
                                {typeof children === "function" && answers
                                    ? (
                                          children as (
                                              currentAnswer: AnswerType,
                                              currentAnswerIndex: number,
                                          ) => ReactNode
                                      )(
                                          answers[currentQuestionStateIndex],
                                          currentQuestionStateIndex,
                                      )
                                    : (children as ReactNode)}
                            </div>
                        </div>

                        {/* action bar */}
                        <ExerciseActionBar
                            actionBarPhase={actionBarPhase}
                            feedbackMessage={feedbackMessage}
                            disableCheck={disableCheck}
                            showSkip={showSkip}
                            onCheckAnswer={() => {
                                tracking.incrementAttempt(
                                    currentQuestionStateIndex,
                                );
                                onCheckAnswer(
                                    questions[currentQuestionStateIndex],
                                );
                            }}
                            onTryAgain={() => {
                                tracking.incrementIncorrectAnswers();
                                onTryAgain();
                            }}
                            onContinue={onContinue}
                            onSkip={onSkip}
                        />
                    </div>
                </>
            )}
            <ConfirmationModal
                isOpen={showExitConfirmation}
                title="Exit session?"
                text="You'll lose your progress if you quit now."
                onConfirmButtonText="Exit"
                onCancelButtonText="Keep going"
                onCancel={() => {
                    setShowExitConfirmation(false);
                }}
                onConfirm={handleEndSession}
            />
            {onSettingsRequested && (
                <ConfirmationModal
                    isOpen={showSettingsConfirmation}
                    title="Change settings?"
                    text="Are you sure you want to return to settings? Your current progress will be reset."
                    onConfirmButtonText="Change"
                    onCancelButtonText="Keep current"
                    onCancel={() => setShowSettingsConfirmation(false)}
                    onConfirm={() => {
                        setShowSettingsConfirmation(false);
                        onSettingsRequested();
                    }}
                />
            )}
        </>
    );
};

export default ExerciseLayout;
