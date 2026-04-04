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
import { useConfetti } from "../../hooks/useConfetti";
import { useAudio } from "../../hooks/useAudio";

interface ExerciseEndscreenProps {
  expGained: number;
  onRepeat: () => void;
}

export const ExerciseEndscreen = ({
  expGained,
  onRepeat,
}: ExerciseEndscreenProps) => {
  const { triggerConfetti } = useConfetti();
  const { play } = useAudio();

  useEffect(() => {
    triggerConfetti();
    play('/static/audio/exercise_complete.wav');
  }, []);

  return (
    <div className={styles.endscreenContainer}>
      {/* Congratulations message */}
      <h1 className={styles.congratsMessage}>Good Job!</h1>

      {/* Celebrating mascot */}
      <div className={styles.logoContainer}>
        <img
          src="/static/images/exercise_content/arlo_celebrating.png"
          alt="Arlo celebrating"
          className={styles.logo}
        />
      </div>

      {/* XP gained section */}
      <div className={styles.expSection}>
        <p className={styles.expLabel}>Experience Points Earned</p>
        <p className={styles.expAmount}>+{expGained} XP</p>
      </div>

      {/* Action buttons */}
      <div className={styles.buttonContainer}>
        <Button
          label="Repeat Exercise"
          variant="secondary"
          onClick={onRepeat}
        />
        <Button
          label="Return to Home"
          variant="primary"
          onClick={() => { window.location.href = '/practise/'; }}
        />
      </div>
    </div>
  );
};

export default ExerciseEndscreen;
