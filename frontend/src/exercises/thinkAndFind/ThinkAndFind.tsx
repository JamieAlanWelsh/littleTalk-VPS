/**
 * Think & Find Exercise
 *
 * Orchestrates the setup screen and the gameplay view.
 */

import { useState } from "react";
import type {
  SentenceMatchingOptions,
  ThinkAndFindPayload,
} from "../../lib/types";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import ThinkAndFindSettingsScreen from "./ThinkAndFindSettingsScreen";
import ThinkAndFindGame from "./ThinkAndFindGame";

const EXERCISE_METADATA = {
  setupTitle: "Think & Find Setup",
  setupSubtitle: "Choose how many pictures to show in each round.",
};

interface ThinkAndFindExerciseProps {
  payload: ThinkAndFindPayload;
}

export const ThinkAndFindExercise = ({
  payload,
}: ThinkAndFindExerciseProps) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [options, setOptions] = useState<SentenceMatchingOptions>({
    numberOfOptions: 4,
  });

  const handleStartExercise = () => {
    setHasStarted(true);
  };

  return !hasStarted ? (
    <ExerciseStartScreen
      title={EXERCISE_METADATA.setupTitle}
      subtitle={EXERCISE_METADATA.setupSubtitle}
      onStart={handleStartExercise}
      onTutorial={() => {
        console.log("Tutorial requested");
      }}
    >
      <ThinkAndFindSettingsScreen onSetOptions={setOptions} />
    </ExerciseStartScreen>
  ) : (
    <ThinkAndFindGame
      payload={payload}
      options={options}
      onSettingsRequested={() => setHasStarted(false)}
    />
  );
};

export default ThinkAndFindExercise;
