/**
 * ConfirmationModal
 *
 * Appears when user attempts to exit the exercise.
 * Shows a warning about losing progress and offers options to continue or exit.
 */

import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import styles from "./ConfirmationModal.module.css";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  text: string;
  onConfirmButtonText: string;
  onCancelButtonText: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmationModal = ({
  isOpen,
  onCancel,
  onConfirm,
  title,
  text,
  onConfirmButtonText,
  onCancelButtonText,
}: ConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className={styles.container}>
        {/* Mascot Icon */}
        <img
          src="/static/images/landing/arlo_waving.png"
          alt="Arlo celebrating"
          className={styles.mascotIcon}
        />

        {/* Message */}
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>
          {text}
        </p>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <Button
            label={onCancelButtonText}
            variant="primary"
            onClick={onCancel}
          />
          <Button label={onConfirmButtonText} variant="secondary" onClick={onConfirm} />
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
