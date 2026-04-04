/**
 * Sentence-to-Picture Matching Exercise
 *
 * Example implementation of the exercise framework.
 * Users read a sentence and click the matching icon/picture.
 */

import { useState, useMemo } from "react";
import type { MatchingExercisePayload2, QuestionState } from "../lib/types";
import ExerciseLayout from "../layouts/exerciseLayout/ExerciseLayout";
import { ImageOption } from "../components/ImageOption";
import { ExerciseEndscreen } from "../layouts/exerciseEndscreen/ExerciseEndscreen";
import type { ExerciseSettingsConfig } from "../layouts/exerciseSettings/types";

const EXERCISE_METADATA = {
  title: "Match the picture to the concept",
  instruction: "Read the sentence and click the picture that best matches it.",
};

interface SentenceToImageMatchingExerciseProps {
  payload: MatchingExercisePayload2;
}

export const SentenceToImageMatchingExercise = ({
  payload,
}: SentenceToImageMatchingExerciseProps) => {
  const shuffledQuestions = useMemo(() => {
    const arr = [...payload.questions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const [remainingQuestions, setRemainingQuestions] = useState(() => [...shuffledQuestions]);
  const [questionState, setQuestionState] = useState<QuestionState>({
    selectedIconIds: [],
    answerState: "notAnswered",
  });
  const [numOptions, setNumOptions] = useState(String(payload.pictures.length));

  const visiblePictures = payload.pictures.slice(0, parseInt(numOptions));

  // Settings configuration for this exercise
  // Would be good to find a consistent way to pass in exercise-specific settings
  const settingsConfig: ExerciseSettingsConfig = {
    title: "Exercise Settings",
    subtitle: "Adjust the difficulty before starting.",
    sections: [
      {
        title: "Number of options:",
        options: Array.from({ length: payload.pictures.length }, (_, i) => ({
          id: String(i + 1),
          label: `${i + 1} option${i + 1 > 1 ? 's' : ''}`,
        })),
        selectedId: numOptions,
        onSelect: setNumOptions,
      },
    ],
    onConfirm: () => {
      setRemainingQuestions([...shuffledQuestions]);
      resetQuestionState();
    },
  };

  const progress = (shuffledQuestions.length - remainingQuestions.length) / shuffledQuestions.length;
  const currentQuestion = remainingQuestions[0];

  const resetQuestionState = () =>
    setQuestionState({ selectedIconIds: [], answerState: "notAnswered" });

  const onCheckAnswer = () => {
    if (questionState.selectedIconIds.length === 0) return;
    const isCorrect = currentQuestion.correctIconIds.every((id) =>
      questionState.selectedIconIds.includes(id),
    );
    setQuestionState((prev) => ({
      ...prev,
      answerState: isCorrect ? "correct" : "incorrect",
    }));
  };

  const onContinue = () => {
    setRemainingQuestions((prev) => prev.slice(1));
    resetQuestionState();
  };

  const onTryAgain = () => resetQuestionState();

  const onSkip = () => {
    setRemainingQuestions((prev) => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
    resetQuestionState();
  };

  return (
    <>
      {remainingQuestions.length === 0 ? (
        <ExerciseEndscreen
          expGained={500}
        />
      ) : (
        <ExerciseLayout
          instruction={currentQuestion.prompt}
          actionBarPhase={questionState.answerState}
          progress={progress}
          onCheckAnswer={onCheckAnswer}
          onTryAgain={onTryAgain}
          onContinue={onContinue}
          onSkip={onSkip}
          settings={settingsConfig}
        >
          {visiblePictures.map((picture) => (
            <ImageOption
              image={picture}
              isCorrect={
                questionState.answerState === "correct"
                  ? true
                  : questionState.answerState === "incorrect"
                    ? false
                    : null
              }
              isSelected={questionState.selectedIconIds.includes(picture.id)}
              isDisabled={
                questionState.answerState !== "notAnswered" &&
                !questionState.selectedIconIds.includes(picture.id)
              }
              onClick={() =>
                setQuestionState((prev) => ({
                  ...prev,
                  selectedIconIds: [picture.id],
                }))
              }
            />
          ))}
        </ExerciseLayout>
      )}
    </>
  );
};

export default SentenceToImageMatchingExercise;
