/**
 * ExerciseLayout Component
 *
 * Generic exercise container that wraps the exercise content.
 * Provides a consistent UX pattern for all exercises built with the framework.
 * 
 * The layout now expects exercises to manage their own zones (prompt, interactables, actions)
 * and feedback/progress indicators internally.
 */

import React, { type ReactNode } from 'react';

interface ExerciseLayoutProps {
  children: ReactNode; // The exercise-specific content (zones, options, etc.)
  prompt?: ReactNode;  // Optional prompt zone rendered above the main card
  feedbackMessage?: string;
  feedbackType?: 'correct' | 'incorrect';
}

export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({
  children,
  prompt,
  feedbackMessage,
  feedbackType,
}) => {
  return (
    <div className="exercise-layout-wrapper">
      {prompt && (
        <div className="exercise-prompt-card">
          {prompt}
        </div>
      )}

      <div className="exercise-container">
        {children}
        {feedbackMessage && (
          <div className={`exercise-feedback ${feedbackType || ''}`}>
            {feedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLayout;
