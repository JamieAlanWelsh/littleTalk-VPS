/**
 * ExerciseLayout Component
 *
 * Generic exercise container that wraps the exercise content.
 * Provides a consistent UX pattern for all exercises built with the framework.
 *
 * The layout now expects exercises to manage their own zones (prompt, interactables, actions)
 * and feedback/progress indicators internally.
 */

import { useState, type ReactNode } from "react";
import styles from "./exerciseLayout.module.css";
import ExerciseActionBar from "../../components/ExerciseActionBar/ExerciseActionBar";
import type { AnswerState, Question } from "../../lib/types";
import { useExerciseTracking, useSubmitExerciseResult } from "../../hooks";
import ExerciseEndscreen from "../exerciseEndscreen/ExerciseEndscreen";
import { TypeAnimation } from 'react-type-animation';

const correctFeedbackMessages = [
  "Great job! That's correct.",
  "Well done! You got it right.",
];

const incorrectFeedbackMessages = [
  "Not quite, try again!",
  "Almost there, give it another shot!",
];

interface ExerciseLayoutProps {
  exerciseId: string;
  title: string;
  actionBarPhase: AnswerState;
  questions: Question[];
  tracking: ReturnType<typeof useExerciseTracking>;
  onCheckAnswer: (question: Question) => void;
  onResetQuestion: () => void;
  children: ReactNode;
}

export const ExerciseLayout = ({
  exerciseId,
  title,
  actionBarPhase,
  questions,
  tracking,
  onCheckAnswer,
  onResetQuestion,
  children,
}: ExerciseLayoutProps) => {
  const [currentQuestionStateIndex, setCurrentQuestionStateIndex] =
    useState<number>(0);
  const submitExerciseMutation = useSubmitExerciseResult();

  const progress = currentQuestionStateIndex / questions.length;
  const isComplete = currentQuestionStateIndex === questions.length;

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
    if (currentQuestionStateIndex === questions.length - 1) {
      console.log("Exercise complete! Submitting results...");
      submitExerciseResults();
    } else {
      setCurrentQuestionStateIndex((prev) => prev + 1);
      onResetQuestion();
    }
  };

  const onTryAgain = () => {
    onResetQuestion();
  };

  return (
    <>
      {isComplete ? (
        <ExerciseEndscreen
          expGained={500}
          onReturnHome={() => alert("would go home")}
        />
      ) : (
        <div className={styles.exerciseLayoutWrapper}>
          {/* progress bar - fixed header */}
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBarInner}>
              <div className={styles.progressBarFill} style={{ width: `${progress * 100}%` }}></div>
            </div>
          </div>

          {/* question */}
          <div className={styles.exercisePromptCard}>
            <h2 style={{ fontSize: 'var(--text-large)', fontWeight: 'bold', color: 'var(--font-color)' }}>
              <TypeAnimation
                key={title}
                sequence={[title]}
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
              {children}
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
          />
        </div>
      )}
    </>
  );
};

export default ExerciseLayout;
