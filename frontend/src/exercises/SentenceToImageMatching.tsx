/**
 * Sentence-to-Picture Matching Exercise
 *
 * Example implementation of the exercise framework.
 * Users read a sentence and click the matching icon/picture.
 */

import { useState } from "react";
import type {
  MatchingExercisePayload2,
  Question,
  QuestionState,
} from "../lib/types";
import ExerciseLayout from "../layouts/exerciseLayout/ExerciseLayout";
import { ImageOption } from "../components/ImageOption";
import { useExerciseTracking } from "../hooks";

const EXERCISE_METADATA = {
  id: "sentence-to-image-matching",
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
  const tracking = useExerciseTracking(payload.questions.length);

  const onCheckAnswer = (question: Question) => {
    if (questionState.selectedIconIds.length === 0) return;

    if (
      question.correctIconIds.every((id) =>
        questionState.selectedIconIds.includes(id),
      )
    ) {
      tracking.incrementAttempt(payload.questions.indexOf(question));
      setQuestionState((prev) => ({
        ...prev,
        answerState: "correct",
      }));
    } else {
      tracking.incrementIncorrectAnswers();
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
    <>
      <ExerciseLayout
        exerciseId={EXERCISE_METADATA.id}
        title={EXERCISE_METADATA.title}
        actionBarPhase={questionState.answerState}
        questions={payload.questions}
        tracking={tracking}
        onCheckAnswer={onCheckAnswer}
        onResetQuestion={onResetAnswer}
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
    </>
  );
};

export default SentenceToImageMatchingExercise;
