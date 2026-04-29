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
import { TypeAnimation } from "react-type-animation";
import { useAudio } from "../../hooks/useAudio";

const correctFeedbackMessages = [
    "Great job! That's correct.",
    "Well done! You got it right.",
];

const incorrectFeedbackMessages = [
    "Not quite, try again!",
    "Almost there, give it another shot!",
];

interface ExerciseLayoutProps<AnswerType> {
  exerciseId: string;
  actionBarPhase: AnswerState;
  questions: Question[];
  answers: AnswerType[]; // Optional, for exercises that want to pass pre-processed answer data
  tracking: ReturnType<typeof useExerciseTracking>;
  onCheckAnswer: (question: Question) => void;
  onResetQuestion: () => void;
  onSettingsRequested?: () => void;
  children: (currentAnswer: AnswerType) => ReactNode;
}

export const ExerciseLayout = <AnswerType,>({
  exerciseId,
  actionBarPhase,
  questions,
  answers,
  tracking,
  onCheckAnswer,
  onResetQuestion,
  onSettingsRequested,
  children,
}: ExerciseLayoutProps<AnswerType>) => {
  const [currentQuestionStateIndex, setCurrentQuestionStateIndex] =
    useState<number>(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showSettingsConfirmation, setShowSettingsConfirmation] =
    useState(false);
  const submitExerciseMutation = useSubmitExerciseResult();

  const progress = currentQuestionStateIndex / questions.length;
  const isComplete = currentQuestionStateIndex === questions.length;
  const isLastQuestion = currentQuestionStateIndex === questions.length - 1;

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
    submitExerciseMutation.mutate({
      nonce: `${Date.now()}-${Math.random()}`,
      exp: 10,
      totalExercises: 1,
      exerciseId: exerciseId,
      difficultySelected: "medium",
      startedAt: tracking.startedAt,
      completedAt: completedAt,
      totalQuestions: questions.length,
      incorrectAnswers: tracking.incorrectAnswers,
      attemptsPerQuestion: tracking.attemptsPerQuestion,
    });
  };

  const onContinue = () => {
    setCurrentQuestionStateIndex((prev) => prev + 1);
    if (isLastQuestion) {
      submitExerciseResults();
    } else {
      onResetQuestion();
    }
  };

  const onSkip = () => {
    tracking.incrementSkips();
    onContinue();
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
        <ExerciseEndscreen expGained={500} onReturnHome={handleEndSession} />
      ) : (
        <div className={styles.exerciseLayoutWrapper}>
          {/* progress bar - fixed header */}
          <div className={styles.progressBarContainer}>
            {onSettingsRequested && (
              <button
                className={styles.settingsButton}
                onClick={() => setShowSettingsConfirmation(true)}
                title="Exercise settings"
                type="button"
              >
                ⚙
              </button>
            )}
            <div className={styles.progressBarInner}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
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
          </div>

          {/* question */}
          <div className={styles.exercisePromptCard}>
            <h2
              style={{
                fontSize: "var(--text-large)",
                fontWeight: "bold",
                color: "var(--font-color)",
              }}
            >
              <TypeAnimation
                key={questions[currentQuestionStateIndex].id} // Reset animation on question change
                sequence={[questions[currentQuestionStateIndex].prompt]}
                speed={60}
                cursor={false}
              />
            </h2>
          </div>

          {/* answer */}
          <div className={styles.exerciseContainer}>
            <div
              className={`${styles.exerciseZone} ${styles.exerciseZoneInteractive}`}
            >
              {children(answers[currentQuestionStateIndex])}
            </div>
          </div>

          {/* action bar */}
          <ExerciseActionBar
            actionBarPhase={actionBarPhase}
            feedbackMessage={feedbackMessage}
            onCheckAnswer={() => {
              tracking.incrementAttempt(currentQuestionStateIndex);
              onCheckAnswer(questions[currentQuestionStateIndex]);
            }}
            onTryAgain={() => {
              tracking.incrementIncorrectAnswers();
              onTryAgain();
            }}
            onContinue={onContinue}
            onSkip={onSkip}
          />
        </div>
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
