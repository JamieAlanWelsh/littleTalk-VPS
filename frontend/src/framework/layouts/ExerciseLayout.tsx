/**
 * ExerciseLayout Component
 *
 * Generic exercise container that wraps the exercise content.
 * Provides a consistent UX pattern for all exercises built with the framework.
 * 
 * The layout now expects exercises to manage their own zones (prompt, interactables, actions)
 * and feedback/progress indicators internally.
 */

import { type ReactNode } from 'react';
import styles from './exerciseLayout.module.css';
import ExerciseActionBar from './ExerciseActionBar';
import type { AnswerState } from '../../lib/types';

const correctFeedbackMessages = [
    "Great job! That's correct.",
    "Well done! You got it right.",
];

const incorrectFeedbackMessages = [
    "Not quite, try again!",
    "Almost there, give it another shot!",
];

interface ExerciseLayoutProps {
  title: string;
  instruction: string;
  actionBarPhase: AnswerState;
  onCheckAnswer: () => void;
  onTryAgain: () => void;
  onContinue: () => void;
  children: ReactNode;
}

export const ExerciseLayout = ({
  children,
  title,
  instruction,
  actionBarPhase,
  onCheckAnswer,
  onTryAgain,
  onContinue,
}: ExerciseLayoutProps) => {
  const feedbackMessage = actionBarPhase === 'correct'
    ? correctFeedbackMessages[Math.floor(Math.random() * correctFeedbackMessages.length)]
    : actionBarPhase === 'incorrect'
      ? incorrectFeedbackMessages[Math.floor(Math.random() * incorrectFeedbackMessages.length)]
      : '';

  return (
    <>
      <div className={styles.exerciseLayoutWrapper}>
        <div className={styles.exercisePromptCard}>
          <h2 style={{ fontSize: 'var(--text-large)', fontWeight: 'bold', paddingBottom: '2rem' }}>{title}</h2>
          <p>{instruction}</p>
        </div>

        <div className={styles.exerciseContainer}>
          <div className={`${styles.exerciseZone} ${styles.exerciseZoneInteractive}`}>
            {children}
          </div>
        </div>
        <ExerciseActionBar
          actionBarPhase={actionBarPhase}
          feedbackMessage={feedbackMessage}
          onCheckAnswer={onCheckAnswer}
          onTryAgain={onTryAgain}
          onContinue={onContinue}
        />
      </div>
    </>
  );
};

export default ExerciseLayout;
