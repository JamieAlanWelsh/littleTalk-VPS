/**
 * Sentence-to-Picture Matching Game
 *
 * Displays the exercise and handles user interactions.
 * Receives filtered questions and pictures from the parent component.
 */

import { useState } from "react";
import type {
  Question,
  QuestionState,
  MatchingExercisePayload2,
  SentenceMatchingOptions,
} from "../../lib/types";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import { ImageOption } from "../../components/ImageOption";
import { useExerciseTracking } from "../../hooks";

const EXERCISE_METADATA = {
  id: "sentence-to-image-matching",
  title: "Match the picture to the concept",
  instruction: "Read the sentence and click the picture that best matches it.",
};

interface SentenceToImageMatchingGameProps {
  payload: MatchingExercisePayload2;
  options: SentenceMatchingOptions;
}

export const SentenceToImageMatchingGame = ({
  payload,
  options,
}: SentenceToImageMatchingGameProps) => {
  // Filter questions and randomize pictures based on options
  const filteredQuestions = payload.questions.filter(
    (q) => q.correctIconIds.length <= options.numberOfOptions,
  );
  const randomizedPictures = payload.pictures
    .sort(() => Math.random() - 0.5)
    .slice(0, options.numberOfOptions);
  const [questionState, setQuestionState] = useState<QuestionState>({
    selectedIconIds: [],
    answerState: "notAnswered",
  });
  const tracking = useExerciseTracking(filteredQuestions.length);

  const onCheckAnswer = (question: Question) => {
    if (questionState.selectedIconIds.length === 0) return;

    if (
      question.correctIconIds.every((id) =>
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

  const onResetAnswer = () => {
    setQuestionState({
      selectedIconIds: [],
      answerState: "notAnswered",
    });
  };

  return (
    <ExerciseLayout
      exerciseId={EXERCISE_METADATA.id}
      actionBarPhase={questionState.answerState}
      questions={filteredQuestions}
      tracking={tracking}
      onCheckAnswer={onCheckAnswer}
      onResetQuestion={onResetAnswer}
    >
      {randomizedPictures.map((picture) => (
        <ImageOption
          key={picture.id}
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

export default SentenceToImageMatchingGame;
