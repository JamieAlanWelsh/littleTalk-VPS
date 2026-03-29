/**
 * Sentence-to-Picture Matching Exercise
 *
 * Example implementation of the exercise framework.
 * Users read a sentence and click the matching icon/picture.
 */

import { useState } from "react";
import type { MatchingExercisePayload2, QuestionState } from "../lib/types";
import ExerciseLayout from "../layouts/ExerciseLayout";
import { ImageOption } from "../components/ImageOption";

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
  const [questionState, setQuestionState] = useState<QuestionState>({
    selectedIconIds: [],
    answerState: "notAnswered",
  });
  const [currentQuestionStateIndex, setCurrentQuestionStateIndex] =
    useState<number>(0);

  const onCheckAnswer = () => {
    if (questionState.selectedIconIds.length === 0) return;

    if (
      payload.questions[currentQuestionStateIndex].correctIconIds.every((id) =>
        questionState.selectedIconIds.includes(id),
      )
    ) {
      setQuestionState((prev) => ({
        ...prev,
        answerState: "correct",
      }));
    } else {
      setQuestionState((prev) => ({
        ...prev,
        answerState: "incorrect",
      }));
    }
  };

  const onContinue = () => {
    if (currentQuestionStateIndex === payload.questions.length - 1) {
      // Exercise complete - could trigger a callback here
      alert("Exercise complete!");
    } else {
      setCurrentQuestionStateIndex((prev) => prev + 1);
      setQuestionState({
        selectedIconIds: [],
        answerState: "notAnswered",
      });
    }
  };

  const onTryAgain = () => {
    setQuestionState({
      selectedIconIds: [],
      answerState: "notAnswered",
    });
  };

  return (
    <ExerciseLayout
      title={EXERCISE_METADATA.title}
      instruction={payload.questions[currentQuestionStateIndex].prompt}
      actionBarPhase={questionState.answerState}
      onCheckAnswer={onCheckAnswer}
      onTryAgain={onTryAgain}
      onContinue={onContinue}
    >
      {payload.pictures.map((picture) => (
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
  );
};

export default SentenceToImageMatchingExercise;
