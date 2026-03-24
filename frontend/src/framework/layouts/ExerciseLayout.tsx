/**
 * ExerciseLayout Component
 *
 * Generic exercise container that handles layout, state management, and transitions.
 * Provides a consistent UX pattern for all exercises built with the framework.
 */

import React, { ReactNode } from 'react';

interface ExerciseLayoutProps {
  title: string;
  instructions: string;
  children: ReactNode; // The exercise-specific content (prompt, options, etc.)
  feedbackMessage?: string;
  feedbackType?: 'correct' | 'incorrect';
  progressLabel?: string; // e.g., "1 of 5"
  onSubmit?: () => void;
  onRetry?: () => void;
  onNext?: () => void;
  submitButtonLabel?: string;
  retryButtonLabel?: string;
  nextButtonLabel?: string;
  showSubmitButton?: boolean;
  showRetryButton?: boolean;
  showNextButton?: boolean;
  submitButtonDisabled?: boolean;
}

export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({
  title,
  instructions,
  children,
  feedbackMessage,
  feedbackType,
  progressLabel,
  onSubmit,
  onRetry,
  onNext,
  submitButtonLabel = 'Submit',
  retryButtonLabel = 'Try Again',
  nextButtonLabel = 'Next',
  showSubmitButton = true,
  showRetryButton = false,
  showNextButton = false,
  submitButtonDisabled = false,
}) => {
  return (
    <div className="exercise-container">
      {/* Header */}
      <div className="exercise-header">
        <h1 className="exercise-title">{title}</h1>
        <p className="exercise-instructions">{instructions}</p>
      </div>

      {/* Main Content */}
      <div className="exercise-content">
        {children}
      </div>

      {/* Feedback */}
      {feedbackMessage && (
        <div className={`exercise-feedback ${feedbackType || ''}`}>
          {feedbackMessage}
        </div>
      )}

      {/* Progress Indicator */}
      {progressLabel && (
        <div className="exercise-progress">
          {progressLabel}
        </div>
      )}

      {/* Action Buttons */}
      <div className="exercise-button-group">
        {showSubmitButton && (
          <button
            className="exercise-button primary"
            onClick={onSubmit}
            disabled={submitButtonDisabled}
            type="button"
          >
            {submitButtonLabel}
          </button>
        )}
        {showRetryButton && (
          <button
            className="exercise-button secondary"
            onClick={onRetry}
            type="button"
          >
            {retryButtonLabel}
          </button>
        )}
        {showNextButton && (
          <button
            className="exercise-button primary"
            onClick={onNext}
            type="button"
          >
            {nextButtonLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExerciseLayout;
