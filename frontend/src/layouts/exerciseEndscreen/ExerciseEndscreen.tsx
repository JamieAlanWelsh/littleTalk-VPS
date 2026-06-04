/**
 * ExerciseEndscreen Component
 *
 * Displayed when a user completes an exercise session.
 * Shows congratulatory message, logo, XP earned, and navigation button.
 * Displays confetti animation on mount.
 */

import { useEffect, useState } from "react";
import styles from "./exerciseEndscreen.module.css";
import { Button } from "../../components/Button/Button";
import { useConfetti } from "../../hooks";
import { useAudio } from "../../hooks/useAudio";

const COUNT_ANIMATION_DURATION_MS = 1000;

const parseElapsedTimeLabel = (elapsedTimeLabel: string): number => {
    const trimmedValue = elapsedTimeLabel.trim();
    const minutesMatch = trimmedValue.match(/(\d+)m/);
    const secondsMatch = trimmedValue.match(/(\d+)s/);
    const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? Number(secondsMatch[1]) : 0;
    return minutes * 60 + seconds;
};

const formatElapsedSeconds = (totalSeconds: number): string => {
    const clampedSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(clampedSeconds / 60);
    const seconds = clampedSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
};

const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

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
    const [animatedExp, setAnimatedExp] = useState(0);
    const [animatedAccuracy, setAnimatedAccuracy] = useState(0);
    const [animatedElapsedSeconds, setAnimatedElapsedSeconds] = useState(0);

    useEffect(() => {
        triggerConfetti();
        play("/static/audio/exercise_complete.wav");
    }, [play, triggerConfetti]);

    useEffect(() => {
        const targetElapsedSeconds = parseElapsedTimeLabel(elapsedTimeLabel);
        let animationFrameId = 0;
        const animationStart = performance.now();

        const animateValues = (currentTime: number) => {
            const elapsed = currentTime - animationStart;
            const progress = Math.min(1, elapsed / COUNT_ANIMATION_DURATION_MS);
            const easedProgress = easeOutCubic(progress);

            setAnimatedExp(Math.round(expGained * easedProgress));
            setAnimatedAccuracy(Math.round(accuracyPercent * easedProgress));
            setAnimatedElapsedSeconds(
                Math.round(targetElapsedSeconds * easedProgress),
            );

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animateValues);
            }
        };

        setAnimatedExp(0);
        setAnimatedAccuracy(0);
        setAnimatedElapsedSeconds(0);
        animationFrameId = requestAnimationFrame(animateValues);

        return () => cancelAnimationFrame(animationFrameId);
    }, [accuracyPercent, elapsedTimeLabel, expGained]);

    return (
        <div className={styles.endscreenContainer}>
            {/* Congratulations message */}
            <h1 className={styles.congratsMessage}>Great Job!</h1>

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
                    <p className={styles.metricValue}>
                        <span className={styles.metricValueInner}>
                            {animatedExp}
                        </span>
                    </p>
                </div>
                <div
                    className={`${styles.metricCard} ${styles.metricCardAccuracy}`}
                >
                    <p className={styles.metricLabel}>Accuracy</p>
                    <p className={styles.metricValue}>
                        <span className={styles.metricValueInner}>
                            {animatedAccuracy}%
                        </span>
                    </p>
                </div>
                <div
                    className={`${styles.metricCard} ${styles.metricCardTime}`}
                >
                    <p className={styles.metricLabel}>Time</p>
                    <p className={styles.metricValue}>
                        <span className={styles.metricValueInner}>
                            {formatElapsedSeconds(animatedElapsedSeconds)}
                        </span>
                    </p>
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
