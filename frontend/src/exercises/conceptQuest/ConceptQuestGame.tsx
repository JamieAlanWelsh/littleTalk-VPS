/**
 * Concept Quest Game
 *
 * Builds concept-based prompt rounds from ordered image sets.
 */

import { useMemo, useState } from "react";
import type {
    ConceptQuestConcept,
    ConceptQuestComplexity,
    ConceptQuestItem,
    ConceptQuestOptions,
    ConceptQuestPayload,
    ExerciseDifficulty,
    Picture,
    Question,
    QuestionState,
} from "../../lib/types";
import { ImageOption } from "../../components/ImageOption";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import { shuffleArray } from "../../utils/shuffleArray";
import styles from "./conceptQuest.module.css";

const EXERCISE_ID = "concept-quest";

const WORD_FORMS: Record<ConceptQuestConcept, [string, string, string]> = {
    big: ["big", "bigger", "biggest"],
    small: ["small", "smaller", "smallest"],
    short: ["short", "shorter", "shortest"],
    long: ["long", "longer", "longest"],
    tall: ["tall", "taller", "tallest"],
};

const getComplexityLabel = (complexity: ConceptQuestComplexity): string => {
    switch (complexity) {
        case 1:
            return "Positive";
        case 2:
            return "Comparative";
        case 3:
            return "Superlative";
        case 4:
            return "Comparative+";
        case 5:
            return "Descriptive";
    }
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

const isLowEndConcept = (concept: ConceptQuestConcept) =>
    concept === "small" || concept === "short";

const getOptionCount = (complexity: ConceptQuestComplexity) =>
    complexity === 2 ? 2 : complexity === 3 ? 4 : complexity === 5 ? 5 : 3;

const getMiddlePrompt = (concept: ConceptQuestConcept) => {
    const [, comparative, superlative] = WORD_FORMS[concept];
    return `${comparative} but not ${superlative}`;
};

const toPicture = (item: ConceptQuestItem): Picture => ({
    id: item.id,
    imageUrl: item.imageUrl,
    label: item.label,
    altText: item.altText,
});

const getPrompt = (
    concept: ConceptQuestConcept,
    complexity: ConceptQuestComplexity,
    subject: string,
) =>
    complexity === 4
        ? `Which ${subject} is ${getMiddlePrompt(concept)}?`
        : `Which ${subject} is ${WORD_FORMS[concept][complexity - 1]}?`;

const getDescriptivePrompt = (item: ConceptQuestItem) =>
    `Can you show me ${item.altText ?? item.label}?`;

const buildRounds = (
    payload: ConceptQuestPayload,
    options: ConceptQuestOptions,
): { questions: Question[]; answers: ConceptQuestAnswer[] } => {
    const compatibleSets = payload.imageSets.filter((imageSet) =>
        imageSet.supportedConcepts.some((concept) =>
            options.concepts.includes(concept),
        ),
    );

    const supportedComplexities = options.complexities.filter(
        (complexity) => complexity === 5 || compatibleSets.length > 0,
    );

    if (supportedComplexities.length === 0) {
        return { questions: [], answers: [] };
    }

    const questions: Question[] = [];
    const answers: ConceptQuestAnswer[] = [];

    for (let roundIndex = 0; roundIndex < payload.rounds; roundIndex += 1) {
        const complexity =
            supportedComplexities[
                Math.floor(Math.random() * supportedComplexities.length)
            ];
        const candidateSets =
            complexity === 5 ? payload.imageSets : compatibleSets;
        const imageSet =
            candidateSets[Math.floor(Math.random() * candidateSets.length)];
        const availableConcepts = imageSet.supportedConcepts.filter((concept) =>
            options.concepts.includes(concept),
        );
        const optionCount = getOptionCount(complexity);
        const concept =
            availableConcepts[
                Math.floor(Math.random() * availableConcepts.length)
            ] ?? imageSet.supportedConcepts[0];
        let startIndex = 0;
        const optionItems =
            complexity === 5
                ? [...imageSet.items]
                : complexity === 4
                  ? (() => {
                        const middleIndex = Math.floor(
                            imageSet.items.length / 2,
                        );
                        return [
                            imageSet.items[0],
                            imageSet.items[middleIndex],
                            imageSet.items[imageSet.items.length - 1],
                        ];
                    })()
                  : (() => {
                        const maxStartIndex =
                            imageSet.items.length - optionCount;
                        startIndex = Math.floor(
                            Math.random() * (maxStartIndex + 1),
                        );
                        return imageSet.items.slice(
                            startIndex,
                            startIndex + optionCount,
                        );
                    })();
        const descriptiveCorrectItem =
            optionItems[Math.floor(Math.random() * optionItems.length)];
        const correctItem =
            complexity === 5
                ? descriptiveCorrectItem
                : complexity === 4
                  ? optionItems[1]
                  : isLowEndConcept(concept)
                    ? optionItems[0]
                    : optionItems[optionItems.length - 1];

        const roundOptions =
            complexity === 5
                ? shuffleArray(optionItems)
                : complexity === 4
                  ? [optionItems[2], optionItems[1], optionItems[0]]
                  : shuffleArray(optionItems);

        questions.push({
            id: `${imageSet.id}-${concept}-${complexity}-${startIndex}-${roundIndex + 1}`,
            prompt:
                complexity === 5
                    ? getDescriptivePrompt(correctItem)
                    : getPrompt(concept, complexity, imageSet.subject),
            correctIconIds: [correctItem.id],
        });

        answers.push({
            correctIconId: correctItem.id,
            options: roundOptions.map(toPicture),
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
    const selectedComplexity: ConceptQuestComplexity =
        options.complexities.reduce<ConceptQuestComplexity>(
            (currentMax, complexity) =>
                complexity > currentMax ? complexity : currentMax,
            1,
        );
    const difficulty: ExerciseDifficulty = {
        level: selectedComplexity,
        label: getComplexityLabel(selectedComplexity),
    };
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
            <p>
                Unable to build Concept Quest rounds for the selected concepts.
            </p>
        );
    }

    return (
        <ExerciseLayout<ConceptQuestAnswer>
            exerciseId={EXERCISE_ID}
            actionBarPhase={questionState.answerState}
            questions={gameData.questions}
            answers={gameData.answers}
            tracking={tracking}
            difficulty={difficulty}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetAnswer}
            onSettingsRequested={onSettingsRequested}
        >
            {(currentAnswer: ConceptQuestAnswer) => (
                <div className={styles.optionsGrid}>
                    {currentAnswer.options.map((picture) => {
                        const isSelected =
                            questionState.selectedIconIds.includes(picture.id);
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
                                    questionState.answerState !==
                                        "notAnswered" && !isSelected
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
