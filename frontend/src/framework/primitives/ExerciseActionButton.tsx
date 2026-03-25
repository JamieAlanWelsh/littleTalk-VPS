/**
 * ExerciseActionButton Component
 *
 * Reusable action button primitive for exercise controls.
 * Intended for actions like Check Answer, Try Again, Next, Continue.
 */

import React from 'react';

type ExerciseActionButtonVariant = 'primary' | 'secondary';

interface ExerciseActionButtonProps {
  label: string;
  variant?: ExerciseActionButtonVariant;
  disabled?: boolean;
  onClick: () => void;
}

export const ExerciseActionButton: React.FC<ExerciseActionButtonProps> = ({
  label,
  variant = 'primary',
  disabled = false,
  onClick,
}) => {
  return (
    <button
      className={`exercise-button ${variant}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  );
};

export default ExerciseActionButton;
