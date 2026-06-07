/**
 * Exercise Start Screen Component
 *
 * Generic setup screen container that accepts custom middleware zone content.
 * Zone 1: Title (fixed)
 * Zone 2: Children/Custom Content (flexible - exercise-specific)
 * Zone 3: Action Buttons (fixed)
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Button from "../../components/Button/Button";
import { useAudio } from "../../hooks/useAudio";
import styles from "./ExerciseStartScreen.module.css";

const CLOSE_ANIMATION_MS = 420;

interface ExerciseStartScreenProps {
    title: string;
    subtitle: string;
    children: ReactNode; // Zone 2: Custom content
    onStart: (params: Record<string, unknown>) => void;
    startButtonLabel?: string;
}

export const ExerciseStartScreen = ({
    title,
    subtitle,
    children,
    onStart,
    startButtonLabel = "Confirm & Start",
}: ExerciseStartScreenProps) => {
    const [isClosing, setIsClosing] = useState(false);
    const closeTimeoutRef = useRef<number | null>(null);
    const { play } = useAudio();

    useEffect(() => {
        play("/static/audio/swish.wav");
    }, [play]);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current !== null) {
                window.clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const handleStart = () => {
        if (isClosing) {
            return;
        }

        play("/static/audio/swoosh.wav");
        setIsClosing(true);
        closeTimeoutRef.current = window.setTimeout(() => {
            onStart({});
        }, CLOSE_ANIMATION_MS);
    };

    return (
        <div
            className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`.trim()}
        >
            <div
                className={`${styles.container} ${isClosing ? styles.containerClosing : ""}`.trim()}
            >
                {/* Zone 1: Title Card */}
                <div className={styles.card}>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>

                {/* Zone 2: Custom Content Card */}
                <div className={styles.card}>{children}</div>

                {/* Zone 3: Actions Card */}
                <div className={styles.card}>
                    <div className={styles.buttonsContainer}>
                        <Button
                            label={startButtonLabel}
                            variant="primary"
                            width={"100%"}
                            onClick={handleStart}
                            disabled={isClosing}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExerciseStartScreen;
