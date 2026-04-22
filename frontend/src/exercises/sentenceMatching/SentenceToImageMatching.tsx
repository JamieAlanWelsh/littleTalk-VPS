/**
 * Sentence-to-Picture Matching Exercise
 *
 * Orchestrates the exercise flow: setup screen → exercise display.
 * Manages setup parameters and delegates exercise display to SentenceToImageMatchingGame.
 */

import { useState } from "react";
import type {
  MatchingExercisePayload2,
  SentenceMatchingOptions,
} from "../../lib/types";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import SentenceMatchingStartScreen from "./SentenceMatchingSettingsScreen";
import SentenceToImageMatchingGame from "./SentenceToImageMatchingGame";

const EXERCISE_METADATA = {
  setupTitle: "Sentence Matching Setup",
  setupSubtitle: "What would you like to work on today?",
};

interface SentenceToImageMatchingExerciseProps {
  payload: MatchingExercisePayload2;
}

export const SentenceToImageMatchingExercise = ({
  payload,
}: SentenceToImageMatchingExerciseProps) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [options, setOptions] = useState<SentenceMatchingOptions>({
    numberOfOptions: 4,
  });

  const handleStartExercise = () => {
    setHasStarted(true);
  };

  // Show setup screen until exercise is started
  return !hasStarted ? (
    <ExerciseStartScreen
      title={EXERCISE_METADATA.setupTitle}
      subtitle={EXERCISE_METADATA.setupSubtitle}
      onStart={handleStartExercise}
      onTutorial={() => {
        // TODO: Implement tutorial modal or navigation
        console.log("Tutorial requested");
      }}
    >
      <SentenceMatchingStartScreen onSetOptions={setOptions} />
    </ExerciseStartScreen>
  ) : (
    <SentenceToImageMatchingGame
      payload={payload}
      options={options}
      onSettingsRequested={() => setHasStarted(false)}
    />
  );
};

export default SentenceToImageMatchingExercise;
