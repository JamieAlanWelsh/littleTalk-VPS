/**
 * Exercise Start Screen Component
 *
 * Generic setup screen container that accepts custom middleware zone content.
 * Zone 1: Title (fixed)
 * Zone 2: Children/Custom Content (flexible - exercise-specific)
 * Zone 3: Action Buttons (fixed)
 */

import { ReactNode } from "react";
import Button from "../../components/Button/Button";
import styles from "./ExerciseStartScreen.module.css";

interface ExerciseStartScreenProps {
  title: string;
  subtitle: string;
  children: ReactNode; // Zone 2: Custom content
  onStart: (params: Record<string, unknown>) => void;
  onTutorial?: () => void;
}

export const ExerciseStartScreen = ({
  title,
  subtitle,
  children,
  onStart,
  onTutorial,
}: ExerciseStartScreenProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
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
              label="Confirm & Start"
              variant="primary"
              width={"100%"}
              onClick={() => onStart({})}
            />
            {onTutorial && (
              <Button
                label="Tutorial / Tips"
                variant="secondary"
                width={"100%"}
                onClick={onTutorial}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseStartScreen;
