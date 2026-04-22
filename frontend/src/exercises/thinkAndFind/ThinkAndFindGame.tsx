/**
 * Think & Find Game
 *
 * Each round chooses a random image set and a random target image.
 * The learner reads the prompt and taps the matching picture.
 */

import { useMemo, useState } from "react";
import type {
  Picture,
  Question,
  QuestionState,
  SentenceMatchingOptions,
  ThinkAndFindPayload,
  ThinkAndFindItem,
} from "../../lib/types";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import { ImageOption } from "../../components/ImageOption";
import { useExerciseTracking } from "../../hooks";
import styles from "./thinkAndFind.module.css";

const EXERCISE_ID = "think-and-find";

interface ThinkAndFindGameProps {
  payload: ThinkAndFindPayload;
  options: SentenceMatchingOptions;
  onSettingsRequested?: () => void;
}

interface ThinkAndFindAnswer {
  options: Picture[];
  correctIconId: string;
}

const shuffleArray = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const toPicture = (item: ThinkAndFindItem): Picture => ({
  id: item.id,
  imageUrl: item.imageUrl,
  label: item.label,
  altText: item.altText,
});

const buildRounds = (
  payload: ThinkAndFindPayload,
  numberOfOptions: number,
): { questions: Question[]; answers: ThinkAndFindAnswer[] } => {
  const roundsToPlay = payload.rounds ?? 5;
  const availableSets = payload.imageSets.filter(
    (imageSet) => imageSet.items.length > 0,
  );

  if (availableSets.length === 0) {
    return { questions: [], answers: [] };
  }

  const questions: Question[] = [];
  const answers: ThinkAndFindAnswer[] = [];

  for (let roundIndex = 0; roundIndex < roundsToPlay; roundIndex += 1) {
    const imageSet =
      availableSets[Math.floor(Math.random() * availableSets.length)];
    const maxOptions = Math.min(6, imageSet.items.length);
    const optionCount = Math.max(2, Math.min(numberOfOptions, maxOptions));
    const optionItems = shuffleArray(imageSet.items).slice(0, optionCount);
    const targetItem =
      optionItems[Math.floor(Math.random() * optionItems.length)];

    questions.push({
      id: `${imageSet.id}-${targetItem.id}-${roundIndex + 1}`,
      prompt: targetItem.prompt,
      correctIconIds: [targetItem.id],
    });

    answers.push({
      correctIconId: targetItem.id,
      options: shuffleArray(optionItems).map(toPicture),
    });
  }

  return { questions, answers };
};

export const ThinkAndFindGame = ({
  payload,
  options,
  onSettingsRequested,
}: ThinkAndFindGameProps) => {
  const [questionState, setQuestionState] = useState<QuestionState>({
    selectedIconIds: [],
    answerState: "notAnswered",
  });

  const gameData = useMemo(
    () => buildRounds(payload, options.numberOfOptions),
    [payload, options.numberOfOptions],
  );
  const tracking = useExerciseTracking(gameData.questions.length);

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

  if (gameData.questions.length === 0) {
    return <p>Unable to load any Think &amp; Find image sets.</p>;
  }

  return (
    <ExerciseLayout<ThinkAndFindAnswer>
      exerciseId={EXERCISE_ID}
      actionBarPhase={questionState.answerState}
      questions={gameData.questions}
      answers={gameData.answers}
      tracking={tracking}
      onCheckAnswer={onCheckAnswer}
      onResetQuestion={onResetAnswer}
      onSettingsRequested={onSettingsRequested}
    >
      {(currentAnswer: ThinkAndFindAnswer) => (
        <div className={styles.optionsGrid}>
          {currentAnswer.options.map((picture) => {
            const isSelected = questionState.selectedIconIds.includes(
              picture.id,
            );
            let isCorrect: boolean | null = null;
            if (questionState.answerState === "correct") {
              isCorrect = isSelected;
            } else if (questionState.answerState === "incorrect") {
              // Only mark the selected image as incorrect; do not show the correct answer
              isCorrect = isSelected ? false : null;
            }
            const isDisabled =
              questionState.answerState !== "notAnswered" && !isSelected;

            return (
              <ImageOption
                key={picture.id}
                image={picture}
                isCorrect={isCorrect}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onClick={() =>
                  setQuestionState((prev) => ({
                    ...prev,
                    selectedIconIds: [picture.id],
                  }))
                }
              />
            );
          })}
        </div>
      )}
    </ExerciseLayout>
  );
};

export default ThinkAndFindGame;
