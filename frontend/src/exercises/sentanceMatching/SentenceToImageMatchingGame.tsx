/**
 * Sentence-to-Picture Matching Game
 *
 * Displays the exercise and handles user interactions.
 * Receives filtered questions and pictures from the parent component.
 */

import { useEffect, useMemo, useState } from "react";
import type {
  Question,
  QuestionState,
  MatchingExercisePayload2,
  SentenceMatchingOptions,
  Picture,
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
interface SentaceToImageMatchingAnswer {
  options: Picture[];
}

export const SentenceToImageMatchingGame = ({
  payload,
  options,
}: SentenceToImageMatchingGameProps) => {
  const [questionState, setQuestionState] = useState<QuestionState>({
    selectedIconIds: [],
    answerState: "notAnswered",
  });
  const tracking = useExerciseTracking(payload.questions.length);

  // Only calculate the answers once when the component mounts or when payload/questions/options change
  // This stops them the options changing when a user selects an answer and the component re-renders
  const answers = useMemo(() => {
    const newAnswers: SentaceToImageMatchingAnswer[] = [];
    for (const question of payload.questions) {
      const correctAnswers: Picture[] = payload.pictures.filter((picture) =>
        question.correctIconIds.includes(picture.id),
      );
      const incorrectAnswers: Picture[] = payload.pictures
        .filter((picture) => !question.correctIconIds.includes(picture.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, options.numberOfOptions - correctAnswers.length);
      const optionPictures: Picture[] = [
        ...correctAnswers,
        ...incorrectAnswers,
      ].sort(() => Math.random() - 0.5);
      newAnswers.push({ options: optionPictures });
    }
    return newAnswers;
  }, [payload.questions, payload.pictures, options.numberOfOptions]);

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
    <ExerciseLayout<SentaceToImageMatchingAnswer>
      exerciseId={EXERCISE_METADATA.id}
      actionBarPhase={questionState.answerState}
      questions={payload.questions}
      answers={answers}
      tracking={tracking}
      onCheckAnswer={onCheckAnswer}
      onResetQuestion={onResetAnswer}
    >
      {(currentAnswer: SentaceToImageMatchingAnswer) => (
        <>
          {currentAnswer.options.map((picture) => (
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
        </>
      )}
    </ExerciseLayout>
  );
};

export default SentenceToImageMatchingGame;
