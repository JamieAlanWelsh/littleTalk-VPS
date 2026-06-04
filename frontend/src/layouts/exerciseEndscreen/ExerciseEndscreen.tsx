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
import { useAudio } from "../../hooks/useAudio";

interface ExerciseEndscreenProps {
    expGained: number;
    accuracyPercent?: number;
    elapsedTimeLabel?: string;
    onReturnHome: () => void;
}

export const ExerciseEndscreen = ({
    expGained,
    accuracyPercent = 100,
    elapsedTimeLabel = "—",
    onReturnHome,
}: ExerciseEndscreenProps) => {
    const { triggerConfetti } = useConfetti();
    const { play } = useAudio();

    useEffect(() => {
        triggerConfetti();
        play("/static/audio/exercise_complete.wav");
    }, [triggerConfetti]);

    return (
        <div className={styles.endscreenContainer}>
            {/* Congratulations message */}
            <h1 className={styles.congratsMessage}>Good Job!</h1>

            {/* Celebrating mascot */}
            <div className={styles.logoContainer}>
                <img
                    src="/static/images/arlo_celebrating.png"
                    alt="Arlo is celebrating"
                    className={styles.logo}
                />
            </div>

            {/* Metrics row */}
            <div className={styles.metricsRow}>
                <div className={`${styles.metricCard} ${styles.metricCardExp}`}>
                    <p className={styles.metricLabel}>XP Earned</p>
                    <p className={styles.metricValue}>+{expGained}</p>
                </div>
                <div
                    className={`${styles.metricCard} ${styles.metricCardAccuracy}`}
                >
                    <p className={styles.metricLabel}>Accuracy</p>
                    <p className={styles.metricValue}>{accuracyPercent}%</p>
                </div>
                <div
                    className={`${styles.metricCard} ${styles.metricCardTime}`}
                >
                    <p className={styles.metricLabel}>Time</p>
                    <p className={styles.metricValue}>{elapsedTimeLabel}</p>
                </div>
            </div>

            {/* Action buttons */}
            <div className={styles.buttonContainer}>
                <Button
                    label="Repeat Exercise"
                    variant="secondary"
                    onClick={() => window.location.reload()}
                />
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
