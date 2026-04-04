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
import { TypeAnimation } from 'react-type-animation';
import styles from './exerciseLayout.module.css';
import ExerciseActionBar from '../../components/ExerciseActionBar/ExerciseActionBar';
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
  instruction: string;
  actionBarPhase: AnswerState;
  progress: number;
  onCheckAnswer: () => void;
  onTryAgain: () => void;
  onContinue: () => void;
  children: ReactNode;
}

export const ExerciseLayout = ({
  children,
  instruction,
  actionBarPhase,
  progress,
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
      {/* progress bar - fixed header */}
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBarInner}>
          <div className={styles.progressBarFill} style={{ width: `${progress * 100}%` }}></div>
        </div>
      </div>

      <div className={styles.exerciseLayoutWrapper}>
        {/* question */}
        <div className={styles.exercisePromptCard}>
          <h2 style={{ fontSize: 'var(--text-large)', fontWeight: 'bold', color: 'var(--font-color)' }}>
            <TypeAnimation
              key={instruction}
              sequence={[instruction]}
              speed={60}
              cursor={false}
            />
          </h2>
        </div>

        {/* answer */}
        <div className={styles.exerciseContainer}>
          <div className={`${styles.exerciseZone} ${styles.exerciseZoneInteractive}`}>
            {children}
          </div>
        </div>

        {/* action bar */}
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
