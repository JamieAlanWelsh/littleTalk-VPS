/**
 * ExerciseEndscreen Component
 *
 * Displayed when a user completes an exercise session.
 * Shows congratulatory message, logo, XP earned, and navigation button.
 * Displays confetti animation on mount.
 */

import { useEffect } from "react";
import styles from "./exerciseEndscreen.module.css";
import { Button } from "../../components/Button/Button";
import { useConfetti } from "../../hooks";

interface ExerciseEndscreenProps {
  expGained: number;
  onReturnHome: () => void;
}

export const ExerciseEndscreen = ({
  expGained,
  onReturnHome,
}: ExerciseEndscreenProps) => {
  const { triggerConfetti } = useConfetti();

  useEffect(() => {
    triggerConfetti();
  }, [triggerConfetti]);

  return (
    <div className={styles.endscreenContainer}>
      {/* Congratulations message */}
      <h1 className={styles.congratsMessage}>Good Job!</h1>

      {/* Chatterdillo logo */}
      <div className={styles.logoContainer}>
        <img
          src="/static/images/chatterdillo_logo_official.png"
          alt="Chatterdillo mascot"
          className={styles.logo}
        />
      </div>

      {/* XP gained section */}
      <div className={styles.expSection}>
        <p className={styles.expLabel}>Experience Points Earned</p>
        <p className={styles.expAmount}>+{expGained} XP</p>
      </div>

      {/* Return home button */}
      <div className={styles.buttonContainer}>
        <Button
          label="Return to Home"
          variant="primary"
          onClick={onReturnHome}
        />
      </div>
    </div>
  );
};

export default ExerciseEndscreen;
