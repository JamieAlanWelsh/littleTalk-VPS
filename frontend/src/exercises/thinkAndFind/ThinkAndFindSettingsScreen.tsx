/**
 * Think & Find settings screen
 *
 * Lets the user choose how many image options appear in each round.
 */

import { useEffect, useState } from "react";
import type { SentenceMatchingOptions } from "../../lib/types";
import Button from "../../components/Button/Button";
import styles from "../../layouts/exerciseStartScreen/ExerciseStartScreen.module.css";

interface ThinkAndFindSettingsScreenProps {
  onSetOptions: (options: SentenceMatchingOptions) => void;
}

export const ThinkAndFindSettingsScreen = ({
  onSetOptions,
}: ThinkAndFindSettingsScreenProps) => {
  const [selectedNumOptions, setSelectedNumOptions] = useState(2);
  const optionCounts = [2, 3, 4, 5, 6];

  useEffect(() => {
    onSetOptions({ numberOfOptions: selectedNumOptions });
  }, [selectedNumOptions, onSetOptions]);

  return (
    <>
      <h3 className={styles.sectionTitle}>Number of picture options:</h3>
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

export default ThinkAndFindSettingsScreen;
