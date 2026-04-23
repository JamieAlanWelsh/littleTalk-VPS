/**
 * Concept Quest Game
 *
 * Builds concept-based prompt rounds from ordered image sets.
 */

import { useMemo, useState } from "react";
import type {
  ConceptQuestConcept,
  ConceptQuestItem,
  ConceptQuestOptions,
  ConceptQuestPayload,
  Picture,
  Question,
  QuestionState,
} from "../../lib/types";
import { ImageOption } from "../../components/ImageOption";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import styles from "./conceptQuest.module.css";

const EXERCISE_ID = "concept-quest";

const WORD_FORMS: Record<ConceptQuestConcept, [string, string, string]> = {
  big: ["big", "bigger", "biggest"],
  small: ["small", "smaller", "smallest"],
  short: ["short", "shorter", "shortest"],
  long: ["long", "longer", "longest"],
  tall: ["tall", "taller", "tallest"],
};

interface ConceptQuestGameProps {
  payload: ConceptQuestPayload;
  options: ConceptQuestOptions;
  onSettingsRequested?: () => void;
}

interface ConceptQuestAnswer {
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

const isLowEndConcept = (concept: ConceptQuestConcept) =>
  concept === "small" || concept === "short";

const getOptionCount = (complexity: ConceptQuestOptions["complexity"]) =>
  complexity === 3 ? 4 : 3;

const toPicture = (item: ConceptQuestItem): Picture => ({
  id: item.id,
  imageUrl: item.imageUrl,
  label: item.label,
  altText: item.altText,
});

const getPrompt = (
  concept: ConceptQuestConcept,
  complexity: ConceptQuestOptions["complexity"],
  subject: string,
) => `Which ${subject} is ${WORD_FORMS[concept][complexity - 1]}?`;

const buildRounds = (
  payload: ConceptQuestPayload,
  options: ConceptQuestOptions,
): { questions: Question[]; answers: ConceptQuestAnswer[] } => {
  const roundsToPlay = payload.rounds ?? 5;
  const optionCount = getOptionCount(options.complexity);
  const compatibleSets = payload.imageSets.filter(
    (imageSet) =>
      imageSet.items.length >= optionCount &&
      imageSet.supportedConcepts.some((concept) =>
        options.concepts.includes(concept),
      ),
  );

  if (compatibleSets.length === 0) {
    return { questions: [], answers: [] };
  }

  const questions: Question[] = [];
  const answers: ConceptQuestAnswer[] = [];

  for (let roundIndex = 0; roundIndex < roundsToPlay; roundIndex += 1) {
    const imageSet =
      compatibleSets[Math.floor(Math.random() * compatibleSets.length)];
    const availableConcepts = imageSet.supportedConcepts.filter((concept) =>
      options.concepts.includes(concept),
    );
    const concept =
      availableConcepts[Math.floor(Math.random() * availableConcepts.length)];
    const maxStartIndex = imageSet.items.length - optionCount;
    const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));
    const optionItems = imageSet.items.slice(
      startIndex,
      startIndex + optionCount,
    );
    const correctItem = isLowEndConcept(concept)
      ? optionItems[0]
      : optionItems[optionItems.length - 1];

    questions.push({
      id: `${imageSet.id}-${concept}-${options.complexity}-${startIndex}-${roundIndex + 1}`,
      prompt: getPrompt(concept, options.complexity, imageSet.subject),
      correctIconIds: [correctItem.id],
    });

    answers.push({
      correctIconId: correctItem.id,
      options: shuffleArray(optionItems).map(toPicture),
    });
  }

  return { questions, answers };
};

export const ConceptQuestGame = ({
  payload,
  options,
  onSettingsRequested,
}: ConceptQuestGameProps) => {
  const [questionState, setQuestionState] = useState<QuestionState>({
    selectedIconIds: [],
    answerState: "notAnswered",
  });

  const gameData = useMemo(
    () => buildRounds(payload, options),
    [options, payload],
  );
  const tracking = useExerciseTracking(gameData.questions.length);

  const onCheckAnswer = (question: Question) => {
    if (questionState.selectedIconIds.length === 0) {
      return;
    }

    if (
      question.correctIconIds.every((id) =>
        questionState.selectedIconIds.includes(id),
      )
    ) {
      setQuestionState((previousState) => ({
        ...previousState,
        answerState: "correct",
      }));
    } else {
      setQuestionState((previousState) => ({
        ...previousState,
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
    return (
      <p>Unable to build Concept Quest rounds for the selected concepts.</p>
    );
  }

  return (
    <ExerciseLayout<ConceptQuestAnswer>
      exerciseId={EXERCISE_ID}
      actionBarPhase={questionState.answerState}
      questions={gameData.questions}
      answers={gameData.answers}
      tracking={tracking}
      onCheckAnswer={onCheckAnswer}
      onResetQuestion={onResetAnswer}
      onSettingsRequested={onSettingsRequested}
    >
      {(currentAnswer: ConceptQuestAnswer) => (
        <div className={styles.optionsGrid}>
          {currentAnswer.options.map((picture) => {
            const isSelected = questionState.selectedIconIds.includes(
              picture.id,
            );
            let isCorrect: boolean | null = null;

            if (questionState.answerState === "correct") {
              isCorrect = isSelected;
            } else if (questionState.answerState === "incorrect") {
              isCorrect = isSelected ? false : null;
            }

            return (
              <ImageOption
                key={picture.id}
                image={picture}
                isCorrect={isCorrect}
                isSelected={isSelected}
                isDisabled={
                  questionState.answerState !== "notAnswered" && !isSelected
                }
                onClick={() =>
                  setQuestionState((previousState) => ({
                    ...previousState,
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

export default ConceptQuestGame;
