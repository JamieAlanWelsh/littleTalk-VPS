/**
 * ExerciseActionButton Component
 *
 * Reusable action button primitive for exercise controls.
 * Intended for actions like Check Answer, Try Again, Next, Continue.
 */

import styles from './ExerciseActionButton.module.css';

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
