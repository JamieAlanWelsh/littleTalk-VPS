/**
 * ExerciseActionButton Component
 *
 * Reusable action button primitive for exercise controls.
 * Intended for actions like Check Answer, Try Again, Next, Continue.
 */

import styles from './Button.module.css';

interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
}

export const Button = ({
  label,
  variant = 'primary',
  disabled = false,
  onClick,
}: ButtonProps) => {
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

export default Button;
