import { useMemo, useState } from "react";
import { TextOptionGroup } from "../../components/TextOptionGroup";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { Question, QuestionState } from "../../lib/types";
import { shuffleArray } from "../../utils/shuffleArray";
import type {
    InTheKnowChoiceCount,
    InTheKnowOption,
    InTheKnowPayload,
    InTheKnowRound,
    InTheKnowScenePack,
} from "./types";
import styles from "./inTheKnow.module.css";

const EXERCISE_ID = "in-the-know";

interface InTheKnowGameProps {
    payload: InTheKnowPayload;
    choiceCount: InTheKnowChoiceCount;
    onSettingsRequested?: () => void;
}

interface InTheKnowAnswer {
    scenePack: InTheKnowScenePack;
    round: InTheKnowRound;
    options: InTheKnowOption[];
}

const buildRounds = (
    payload: InTheKnowPayload,
    choiceCount: InTheKnowChoiceCount,
): { questions: Question[]; answers: InTheKnowAnswer[] } => {
    const selectedScenePack = shuffleArray(payload.scenePacks)[0];
    const roundsToPlay = Math.min(
        payload.rounds,
        selectedScenePack.rounds.length,
    );
    const selectedRounds = selectedScenePack.rounds.slice(0, roundsToPlay);
    const optionById = new Map(
        payload.options.map((option) => [option.id, option]),
    );

    const questions: Question[] = selectedRounds.map((round, index) => ({
        id: `${selectedScenePack.id}-${round.id}-${index + 1}`,
        prompt: round.openingPrompt,
        correctIconIds: [round.correctOptionId],
    }));

    const answers: InTheKnowAnswer[] = selectedRounds.map((round) => {
        const correctOption = optionById.get(round.correctOptionId);

        if (!correctOption) {
            return {
                scenePack: selectedScenePack,
                round,
                options: shuffleArray(payload.options).slice(0, choiceCount),
            };
        }

        const distractorCount = choiceCount - 1;
        const distractors = shuffleArray(
            round.distractorOptionIds
                .map((optionId) => optionById.get(optionId))
                .filter(Boolean) as InTheKnowOption[],
        ).slice(0, distractorCount);

        if (distractors.length < distractorCount) {
            const fallbackDistractors = shuffleArray(
                payload.options.filter(
                    (option) =>
                        option.id !== round.correctOptionId &&
                        !distractors.some(
                            (distractor) => distractor.id === option.id,
                        ),
                ),
            ).slice(0, distractorCount - distractors.length);

            return {
                scenePack: selectedScenePack,
                round,
                options: shuffleArray([
                    correctOption,
                    ...distractors,
                    ...fallbackDistractors,
                ]),
            };
        }

        return {
            scenePack: selectedScenePack,
            round,
            options: shuffleArray([correctOption, ...distractors]),
        };
    });

    return { questions, answers };
};

export const InTheKnowGame = ({
    payload,
    choiceCount,
    onSettingsRequested,
}: InTheKnowGameProps) => {
    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const [showStepTwoImage, setShowStepTwoImage] = useState(false);
    const [completionPrompt, setCompletionPrompt] = useState<string | null>(
        null,
    );

    const gameData = useMemo(
        () => buildRounds(payload, choiceCount),
        [choiceCount, payload],
    );
    const tracking = useExerciseTracking(gameData.questions.length);

    const completionPromptByQuestionId = useMemo(
        () =>
            new Map(
                gameData.questions.map((question, index) => [
                    question.id,
                    gameData.answers[index].round.completionPrompt,
                ]),
            ),
        [gameData.answers, gameData.questions],
    );

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
            setShowStepTwoImage(true);
            setCompletionPrompt(
                completionPromptByQuestionId.get(question.id) || null,
            );
            return;
        }

        setQuestionState((previousState) => ({
            ...previousState,
            answerState: "incorrect",
        }));
    };

    const onResetQuestion = () => {
        setQuestionState({
            selectedIconIds: [],
            answerState: "notAnswered",
        });
        setShowStepTwoImage(false);
        setCompletionPrompt(null);
    };

    if (gameData.questions.length === 0) {
        return <p>Unable to load any In The Know rounds.</p>;
    }

    const disableCheck = questionState.selectedIconIds.length === 0;

    return (
        <ExerciseLayout<InTheKnowAnswer>
            exerciseId={EXERCISE_ID}
            actionBarPhase={questionState.answerState}
            questions={gameData.questions}
            answers={gameData.answers}
            tracking={tracking}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetQuestion}
            onSettingsRequested={onSettingsRequested}
            promptOverride={
                questionState.answerState === "correct"
                    ? completionPrompt
                        ? `That's right! ${completionPrompt}`
                        : "That's right!"
                    : undefined
            }
            disableCheck={disableCheck}
        >
            {(currentAnswer: InTheKnowAnswer) => {
                const imageUrl = showStepTwoImage
                    ? currentAnswer.round.stepTwoImageUrl
                    : currentAnswer.scenePack.stepOneImageUrl;
                const altText = showStepTwoImage
                    ? currentAnswer.round.stepTwoAltText || "Scene next step"
                    : currentAnswer.scenePack.stepOneAltText || "Scene clue";

                return (
                    <div className={styles.roundStage}>
                        <div
                            className={`${styles.sceneFrame} ${showStepTwoImage ? styles.sceneFrameRevealed : ""}`}
                        >
                            <img
                                src={imageUrl}
                                alt={altText}
                                className={`${styles.sceneImage} ${showStepTwoImage ? styles.sceneImageFlip : ""}`}
                            />
                        </div>
                        <TextOptionGroup
                            options={currentAnswer.options}
                            selectedOptionId={
                                questionState.selectedIconIds[0] ?? null
                            }
                            answerState={questionState.answerState}
                            disabled={
                                questionState.answerState !== "notAnswered"
                            }
                            onSelect={(optionId: string) => {
                                setQuestionState((previousState) => ({
                                    ...previousState,
                                    selectedIconIds: [optionId],
                                }));
                            }}
                        />
                    </div>
                );
            }}
        </ExerciseLayout>
    );
};

export default InTheKnowGame;
