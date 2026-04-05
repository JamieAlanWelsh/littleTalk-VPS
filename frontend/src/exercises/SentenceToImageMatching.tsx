/**
 * Sentence-to-Picture Matching Exercise
 *
 * Example implementation of the exercise framework.
 * Users read a sentence and click the matching icon/picture.
 */

import { useState } from "react";
import type { MatchingExercisePayload2, QuestionState } from "../lib/types";
import ExerciseLayout from "../layouts/exerciseLayout/ExerciseLayout";
import { ImageOption } from "../components/ImageOption";
import { ExerciseEndscreen } from "../layouts/exerciseEndscreen/ExerciseEndscreen";
import { useSubmitExerciseResult } from "../hooks";

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
  const submitExerciseMutation = useSubmitExerciseResult();

  const progress = currentQuestionStateIndex / payload.questions.length;

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
      // Exercise complete - submit results to backend
      const now = new Date();
      const completedAt = new Date(now.getTime() + 5 * 60000); // 5 minutes later for demo

      submitExerciseMutation.mutate(
        {
          nonce: `${Date.now()}-${Math.random()}`,
          exp: 10,
          totalExercises: 1,
          exerciseId: "matching-exercise",
          difficultySelected: "medium",
          startedAt: now.toISOString(),
          completedAt: completedAt.toISOString(),
          totalQuestions: payload.questions.length,
          incorrectAnswers: 0,
          attemptsPerQuestion: Array(payload.questions.length).fill(1),
        },
        {
          onSuccess: () => {
            console.log("Exercise result submitted successfully");
          },
          onError: (error) => {
            console.error("Failed to submit exercise result:", error);
          },
        },
      );
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
    <>
      {currentQuestionStateIndex === payload.questions.length ? (
        <ExerciseEndscreen
          expGained={500}
          onReturnHome={() => alert("would go home")}
        />
      ) : (
        <ExerciseLayout
          instruction={payload.questions[currentQuestionStateIndex].prompt}
          actionBarPhase={questionState.answerState}
          progress={progress}
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
      )}
    </>
  );
};

export default SentenceToImageMatchingExercise;
