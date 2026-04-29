/**
 * Concept Quest settings screen
 *
 * Lets the user choose which concepts to practise and the prompt complexity.
 */

import { useEffect, useState } from "react";
import type {
  ConceptQuestConcept,
  ConceptQuestComplexity,
  ConceptQuestOptions,
} from "../../lib/types";
import Button from "../../components/Button/Button";
import styles from "./conceptQuest.module.css";

interface ConceptQuestSettingsScreenProps {
  onSetOptions: (options: ConceptQuestOptions) => void;
}

const CONCEPT_OPTIONS: Array<{ label: string; value: ConceptQuestConcept }> = [
  { label: "Big", value: "big" },
  { label: "Small", value: "small" },
  { label: "Short", value: "short" },
  { label: "Long", value: "long" },
  { label: "Tall", value: "tall" },
];

const COMPLEXITY_OPTIONS: Array<{
  label: string;
  value: ConceptQuestComplexity;
}> = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
];

const DEFAULT_CONCEPTS: ConceptQuestConcept[] = CONCEPT_OPTIONS.map(
  (option) => option.value,
);

export const ConceptQuestSettingsScreen = ({
  onSetOptions,
}: ConceptQuestSettingsScreenProps) => {
  const [selectedConcepts, setSelectedConcepts] =
    useState<ConceptQuestConcept[]>(DEFAULT_CONCEPTS);
  const [selectedComplexity, setSelectedComplexity] =
    useState<ConceptQuestComplexity>(1);

  useEffect(() => {
    onSetOptions({
      concepts: selectedConcepts,
      complexity: selectedComplexity,
    });
  }, [onSetOptions, selectedComplexity, selectedConcepts]);

  const toggleConcept = (concept: ConceptQuestConcept) => {
    setSelectedConcepts((currentConcepts) => {
      const isSelected = currentConcepts.includes(concept);

      if (isSelected && currentConcepts.length === 1) {
        return currentConcepts;
      }

      if (isSelected) {
        return currentConcepts.filter((item) => item !== concept);
      }

      return CONCEPT_OPTIONS.map((option) => option.value).filter(
        (item) => currentConcepts.includes(item) || item === concept,
      );
    });
  };

  return (
    <div className={styles.settingsPanel}>
      <section className={styles.settingsGroup}>
        <h3 className={styles.settingsHeading}>A. Concepts</h3>
        <p className={styles.settingsHint}>
          Select 1 or more: big, small, short, long, tall.
        </p>
        <div className={styles.selectionGrid}>
          {CONCEPT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              label={option.label}
              variant={
                selectedConcepts.includes(option.value)
                  ? "primary"
                  : "secondary"
              }
              width={"100%"}
              onClick={() => toggleConcept(option.value)}
            />
          ))}
        </div>
      </section>

      <section className={styles.settingsGroup}>
        <h3 className={styles.settingsHeading}>B. Concept Complexity</h3>
        <p className={styles.settingsHint}>
          Choose 1 level: 1 = big, 2 = bigger, 3 = biggest.
        </p>
        <div className={styles.selectionGridCompact}>
          {COMPLEXITY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              label={option.label}
              variant={
                selectedComplexity === option.value ? "primary" : "secondary"
              }
              width={"100%"}
              onClick={() => setSelectedComplexity(option.value)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ConceptQuestSettingsScreen;
