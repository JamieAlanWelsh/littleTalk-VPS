import { useMemo, useState } from "react";
import { TextOptionGroup } from "../../components/TextOptionGroup";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { Question, QuestionState } from "../../lib/types";
import { shuffleArray } from "../../utils/shuffleArray";
import type {
    WhatHappensNextOption,
    WhatHappensNextPayload,
    WhatHappensNextScene,
} from "./types";
import styles from "./whatHappensNext.module.css";

const EXERCISE_ID = "what-happens-next";

interface WhatHappensNextGameProps {
    payload: WhatHappensNextPayload;
    onSettingsRequested?: () => void;
}

interface WhatHappensNextAnswer {
    scene: WhatHappensNextScene;
    options: WhatHappensNextOption[];
}

const buildRounds = (
    payload: WhatHappensNextPayload,
): { questions: Question[]; answers: WhatHappensNextAnswer[] } => {
    const roundsToPlay = Math.min(payload.rounds, payload.scenes.length);
    const selectedScenes = shuffleArray(payload.scenes).slice(0, roundsToPlay);

    const questions: Question[] = selectedScenes.map((scene, index) => ({
        id: `${scene.id}-${index + 1}`,
        prompt: scene.openingPrompt,
        correctIconIds: [scene.correctOptionId],
    }));

    const answers: WhatHappensNextAnswer[] = selectedScenes.map((scene) => ({
        scene,
        options: payload.options,
    }));

    return { questions, answers };
};

export const WhatHappensNextGame = ({
    payload,
    onSettingsRequested,
}: WhatHappensNextGameProps) => {
    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const [showStepTwoImage, setShowStepTwoImage] = useState(false);
    const [completionPrompt, setCompletionPrompt] = useState<string | null>(
        null,
    );

    const gameData = useMemo(() => buildRounds(payload), [payload]);
    const tracking = useExerciseTracking(gameData.questions.length);

    const completionPromptByQuestionId = useMemo(
        () =>
            new Map(
                gameData.questions.map((question, index) => [
                    question.id,
                    gameData.answers[index].scene.completionPrompt,
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
        return <p>Unable to load any What Happens Next rounds.</p>;
    }

    const disableCheck = questionState.selectedIconIds.length === 0;

    return (
        <ExerciseLayout<WhatHappensNextAnswer>
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
                    ? completionPrompt || undefined
                    : undefined
            }
            disableCheck={disableCheck}
        >
            {(currentAnswer: WhatHappensNextAnswer) => {
                const imageUrl = showStepTwoImage
                    ? currentAnswer.scene.stepTwoImageUrl
                    : currentAnswer.scene.stepOneImageUrl;
                const altText = showStepTwoImage
                    ? currentAnswer.scene.stepTwoAltText || "Scene next step"
                    : currentAnswer.scene.stepOneAltText || "Scene clue";

                return (
                    <div className={styles.roundStage}>
                        <div
                            className={`${styles.sceneFrame} ${showStepTwoImage ? styles.sceneFrameRevealed : ""}`}
                        >
                            <img
                                src={imageUrl}
                                alt={altText}
                                className={styles.sceneImage}
                            />
                        </div>
                        <TextOptionGroup
                            options={currentAnswer.options}
                            selectedOptionId={
                                questionState.selectedIconIds[0] ?? null
                            }
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

export default WhatHappensNextGame;
