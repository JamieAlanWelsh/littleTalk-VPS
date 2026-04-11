/**
 * Sentence Matching Exercise Start Screen
 *
 * Options selection zone for the Sentence Matching exercise.
 * Allows users to select the number of options (1-5) and filters questions accordingly.
 */

import { useState, useEffect } from "react";
import type { SentenceMatchingOptions } from "../../lib/types";
import Button from "../../components/Button/Button";
import styles from "../../layouts/exerciseStartScreen/ExerciseStartScreen.module.css";

interface SentenceMatchingStartScreenProps {
  onSetOptions: (options: SentenceMatchingOptions) => void;
}

export const SentenceMatchingStartScreen = ({
  onSetOptions,
}: SentenceMatchingStartScreenProps) => {
  const [selectedNumOptions, setSelectedNumOptions] = useState(4);
  const optionCounts = [1, 2, 3, 4, 5];

  // Update options whenever selectedNumOptions changes
  useEffect(() => {
    onSetOptions({ numberOfOptions: selectedNumOptions });
  }, [selectedNumOptions, onSetOptions]);

  return (
    <>
      <h3 className={styles.sectionTitle}>Number of options:</h3>
      <div className={styles.optionsList}>
        {optionCounts.map((count) => (
          <Button
            key={count}
            variant={selectedNumOptions === count ? "primary" : "secondary"}
            onClick={() => setSelectedNumOptions(count)}
            width={"100%"}
            label={`${count} ${count === 1 ? "option" : "options"}`}
          />
        ))}
      </div>
    </>
  );
};

export default SentenceMatchingStartScreen;
