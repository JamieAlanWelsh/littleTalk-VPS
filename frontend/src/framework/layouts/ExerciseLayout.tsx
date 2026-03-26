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
  children: ReactNode;
  prompt?: ReactNode;
}

export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({
  children,
  prompt,
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
      </div>
    </div>
  );
};

export default ExerciseLayout;
