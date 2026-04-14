/**
 * SessionSettingsConfirmation Modal
 *
 * Appears when user taps the settings button during an exercise.
 * Warns that returning to settings will restart the exercise, and offers
 * options to cancel or proceed.
 */

import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import styles from "./SessionSettingsConfirmation.module.css";

interface SessionSettingsConfirmationProps {
  isOpen: boolean;
  onCancel: () => void;
  onGoToSettings: () => void;
}

export const SessionSettingsConfirmation = ({
  isOpen,
  onCancel,
  onGoToSettings,
}: SessionSettingsConfirmationProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className={styles.container}>
        {/* Mascot Icon */}
        <img
          src="/static/images/landing/arlo_waving.png"
          alt="Arlo waving"
          className={styles.mascotIcon}
        />

        {/* Message */}
        <h2 className={styles.title}>Adjust settings?</h2>
        <p className={styles.message}>
          Are you sure you want to return to settings? Your current progress
          will be reset.
        </p>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <Button label="Keep going" variant="primary" onClick={onCancel} />
          <Button
            label="Go to settings"
            variant="secondary"
            onClick={onGoToSettings}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SessionSettingsConfirmation;
