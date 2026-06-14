import { useMemo, useState, type CSSProperties } from "react";
import { TextOptionGroup } from "../../components/TextOptionGroup";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type {
    ExerciseDifficulty,
    Question,
    QuestionState,
} from "../../lib/types";
import { shuffleArray } from "../../utils/shuffleArray";
import type {
    InTheKnowChoiceCount,
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
    options: RoundOption[];
}

interface RoundOption {
    id: string;
    label: string;
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

    const questions: Question[] = selectedRounds.map((round, index) => ({
        id: `${selectedScenePack.id}-${round.id}-${index + 1}`,
        prompt: round.openingPrompt,
        correctIconIds: [`${selectedScenePack.id}-${round.id}-correct`],
    }));

    const answers: InTheKnowAnswer[] = selectedRounds.map((round) => {
        const correctOption: RoundOption = {
            id: `${selectedScenePack.id}-${round.id}-correct`,
            label: round.correctOptionLabel,
        };
        const distractorCount = choiceCount - 1;
        const distractors = shuffleArray(
            round.distractorOptionLabels.map((label, index) => ({
                id: `${selectedScenePack.id}-${round.id}-distractor-${index + 1}`,
                label,
            })),
        ).slice(0, distractorCount);

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
    const [sceneAspectRatio, setSceneAspectRatio] = useState(1);

    const gameData = useMemo(
        () => buildRounds(payload, choiceCount),
        [choiceCount, payload],
    );
    const difficulty: ExerciseDifficulty = {
        level: choiceCount,
        label: `${choiceCount} options`,
    };
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

    const sceneFrameStyle: CSSProperties & {
        "--scene-aspect-ratio": number;
    } = {
        "--scene-aspect-ratio": sceneAspectRatio,
    };

    return (
        <ExerciseLayout<InTheKnowAnswer>
            exerciseId={EXERCISE_ID}
            actionBarPhase={questionState.answerState}
            questions={gameData.questions}
            answers={gameData.answers}
            tracking={tracking}
            difficulty={difficulty}
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
                            style={sceneFrameStyle}
                        >
                            <img
                                src={imageUrl}
                                alt={altText}
                                className={`${styles.sceneImage} ${showStepTwoImage ? styles.sceneImageFlip : ""}`}
                                onLoad={(event) => {
                                    const { naturalWidth, naturalHeight } =
                                        event.currentTarget;

                                    if (naturalWidth > 0 && naturalHeight > 0) {
                                        setSceneAspectRatio(
                                            naturalWidth / naturalHeight,
                                        );
                                    }
                                }}
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
