import { useMemo, useState } from "react";
import { TextOptionGroup } from "../../components/TextOptionGroup";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { Question, QuestionState } from "../../lib/types";
import { shuffleArray } from "../../utils/shuffleArray";
import type {
    WhatsInTheBagItem,
    WhatsInTheBagOptions,
    WhatsInTheBagPayload,
} from "./types";
import styles from "./whatsInTheBag.module.css";

const EXERCISE_ID = "whats-in-the-bag";

interface WhatsInTheBagGameProps {
    payload: WhatsInTheBagPayload;
    options: WhatsInTheBagOptions;
    onSettingsRequested?: () => void;
}

interface WordOption {
    id: string;
    label: string;
}

interface WhatsInTheBagAnswer {
    revealedItem: WhatsInTheBagItem;
    wordOptions: WordOption[];
}

const normalizeOptionCount = (value: number): 1 | 2 | 3 => {
    if (value <= 1) return 1;
    if (value >= 3) return 3;
    return 2;
};

const buildRounds = (
    payload: WhatsInTheBagPayload,
    numberOfOptions: number,
): { questions: Question[]; answers: WhatsInTheBagAnswer[] } => {
    const questions: Question[] = [];
    const answers: WhatsInTheBagAnswer[] = [];

    if (payload.items.length === 0) {
        return { questions, answers };
    }

    const optionCount = normalizeOptionCount(numberOfOptions);
    const shuffledTargets = shuffleArray(payload.items);

    for (let roundIndex = 0; roundIndex < payload.rounds; roundIndex += 1) {
        const targetItem = shuffledTargets[roundIndex % shuffledTargets.length];
        const distractorPool = shuffleArray(
            payload.items.filter((item) => item.id !== targetItem.id),
        );
        const distractorCount = Math.min(
            optionCount - 1,
            distractorPool.length,
        );

        const wordOptions = shuffleArray([
            { id: targetItem.id, label: targetItem.label },
            ...distractorPool.slice(0, distractorCount).map((item) => ({
                id: item.id,
                label: item.label,
            })),
        ]);

        questions.push({
            id: `${targetItem.id}-${roundIndex + 1}`,
            prompt: "What's in the bag?",
            correctIconIds: [targetItem.id],
        });

        answers.push({
            revealedItem: targetItem,
            wordOptions,
        });
    }

    return { questions, answers };
};

export const WhatsInTheBagGame = ({
    payload,
    options,
    onSettingsRequested,
}: WhatsInTheBagGameProps) => {
    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const [isBagOpened, setIsBagOpened] = useState(false);
    const [correctPromptLabel, setCorrectPromptLabel] = useState<string | null>(
        null,
    );

    const gameData = useMemo(
        () => buildRounds(payload, options.numberOfOptions),
        [payload, options.numberOfOptions],
    );
    const tracking = useExerciseTracking(gameData.questions.length);

    const idToPromptLabelMap = useMemo(
        () =>
            new Map(
                payload.items.map((item) => [
                    item.id,
                    item.altText ?? item.label,
                ]),
            ),
        [payload.items],
    );

    const onCheckAnswer = (question: Question) => {
        if (!isBagOpened || questionState.selectedIconIds.length === 0) {
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
            const correctId = question.correctIconIds[0];
            setCorrectPromptLabel(idToPromptLabelMap.get(correctId) || null);
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
        setIsBagOpened(false);
        setCorrectPromptLabel(null);
    };

    if (gameData.questions.length === 0) {
        return <p>Unable to load any What&apos;s in the Bag rounds.</p>;
    }

    const promptOverride = correctPromptLabel
        ? `That's right! It's ${correctPromptLabel}`
        : isBagOpened
          ? "What is it?"
          : "What's in the bag?";
    const disableCheck =
        !isBagOpened || questionState.selectedIconIds.length === 0;

    return (
        <ExerciseLayout<WhatsInTheBagAnswer>
            exerciseId={EXERCISE_ID}
            actionBarPhase={questionState.answerState}
            questions={gameData.questions}
            answers={gameData.answers}
            tracking={tracking}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetQuestion}
            onSettingsRequested={onSettingsRequested}
            promptOverride={promptOverride}
            disableCheck={disableCheck}
        >
            {(currentAnswer: WhatsInTheBagAnswer) => {
                if (!isBagOpened) {
                    return (
                        <div className={styles.preRevealStage}>
                            <button
                                className={styles.bagButton}
                                type="button"
                                onClick={() => setIsBagOpened(true)}
                            >
                                <img
                                    src={payload.bagImages.closedImageUrl}
                                    alt={
                                        payload.bagImages.closedAltText ??
                                        "Closed bag"
                                    }
                                    className={styles.closedBagImage}
                                />
                            </button>
                        </div>
                    );
                }

                return (
                    <div className={styles.revealStage}>
                        <div className={styles.bagScene}>
                            <img
                                src={payload.bagImages.openImageUrl}
                                alt={
                                    payload.bagImages.openAltText ?? "Open bag"
                                }
                                className={styles.openBagImage}
                            />
                            <img
                                src={currentAnswer.revealedItem.imageUrl}
                                alt={
                                    currentAnswer.revealedItem.altText ??
                                    currentAnswer.revealedItem.label
                                }
                                className={styles.revealedItemImage}
                            />
                        </div>
                        <TextOptionGroup
                            options={currentAnswer.wordOptions}
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

export default WhatsInTheBagGame;
