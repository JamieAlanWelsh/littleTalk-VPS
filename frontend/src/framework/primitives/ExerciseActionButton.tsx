/**
 * ExerciseActionButton Component
 *
 * Reusable action button primitive for exercise controls.
 * Intended for actions like Check Answer, Try Again, Next, Continue.
 */

import styles from './ExerciseActionButton.module.css';

interface ExerciseActionButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
}

export const ExerciseActionButton = ({
  label,
  variant = 'primary',
  disabled = false,
  onClick,
}: ExerciseActionButtonProps) => {
  const variantClass = variant === 'secondary' ? styles.secondary : styles.primary;

  return (
    <button
      className={`${styles.button} ${variantClass}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  );
};

export default ExerciseActionButton;
