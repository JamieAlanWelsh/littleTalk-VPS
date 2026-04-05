/**
 * SessionExitConfirmation Modal
 *
 * Appears when user attempts to exit the exercise.
 * Shows a warning about losing progress and offers options to continue or exit.
 */

import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import styles from "./SessionExitConfirmation.module.css";

interface SessionExitConfirmationProps {
  isOpen: boolean;
  onKeepLearning: () => void;
  onEndSession: () => void;
}

export const SessionExitConfirmation = ({
  isOpen,
  onKeepLearning,
  onEndSession,
}: SessionExitConfirmationProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onKeepLearning}>
      <div className={styles.container}>
        {/* Mascot Icon */}
        <div className={styles.mascotIcon}>🦉</div>

        {/* Message */}
        <h2 className={styles.title}>Exit session?</h2>
        <p className={styles.message}>
          You'll lose your progress if you quit now
        </p>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <Button
            label="Keep going"
            variant="primary"
            onClick={onKeepLearning}
          />
          <Button label="Exit" variant="secondary" onClick={onEndSession} />
        </div>
      </div>
    </Modal>
  );
};

export default SessionExitConfirmation;
