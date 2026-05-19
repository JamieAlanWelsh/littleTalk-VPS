import type { DragEndEvent } from "@dnd-kit/abstract";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import {
    DragDropProvider,
    KeyboardSensor,
    PointerSensor,
} from "@dnd-kit/react";
import { useMemo, useRef, useState } from "react";
import { DraggableImage } from "../../components/DraggableImage/DraggableImage";
import { DroppableImageZone } from "../../components/DroppableImageZone/DroppableImageZone";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { QuestionState } from "../../lib/types";
import type {
    SpotOnGridLocation,
    SpotOnPreposition,
    SpotOnQuestion,
} from "./types";
import styles from "./spotOnGame.module.css";

interface SpotOnGameProps {
    questions: SpotOnQuestion[];
    onSettingsRequested?: () => void;
}

const EXERCISE_METADATA = {
    id: "spot-on",
};

const GRID_ROWS = 5;
const GRID_COLUMNS = 5;
const CHARACTER_START: SpotOnGridLocation = { row: 4, col: 2 };
const OBJECT_LOCATION: SpotOnGridLocation = { row: 2, col: 2 };
const BETWEEN_LEFT_OBJECT: SpotOnGridLocation = { row: 2, col: 1 };
const BETWEEN_RIGHT_OBJECT: SpotOnGridLocation = { row: 2, col: 3 };

const toCellId = ({ row, col }: SpotOnGridLocation) => `cell:${row}:${col}`;

const parseCellId = (cellId: string): SpotOnGridLocation | null => {
    const [prefix, row, col] = cellId.split(":");

    if (prefix !== "cell" || row == null || col == null) {
        return null;
    }

    const parsedRow = Number(row);
    const parsedCol = Number(col);

    if (Number.isNaN(parsedRow) || Number.isNaN(parsedCol)) {
        return null;
    }

    return { row: parsedRow, col: parsedCol };
};

const locationsEqual = (left: SpotOnGridLocation, right: SpotOnGridLocation) =>
    left.row === right.row && left.col === right.col;

const isLocationCorrect = (
    characterLocation: SpotOnGridLocation,
    preposition: SpotOnPreposition,
): boolean => {
    switch (preposition) {
        case "in":
            return locationsEqual(characterLocation, OBJECT_LOCATION);
        case "on":
            return (
                characterLocation.row === OBJECT_LOCATION.row - 1 &&
                characterLocation.col === OBJECT_LOCATION.col
            );
        case "under":
            return (
                characterLocation.row === OBJECT_LOCATION.row + 1 &&
                characterLocation.col === OBJECT_LOCATION.col
            );
        case "next to":
            return (
                (characterLocation.row === OBJECT_LOCATION.row &&
                    characterLocation.col === OBJECT_LOCATION.col - 1) ||
                (characterLocation.row === OBJECT_LOCATION.row &&
                    characterLocation.col === OBJECT_LOCATION.col + 1)
            );
        case "above":
            // Top row (0), middle column (2) for 5x5 grid
            return characterLocation.row === 0 && characterLocation.col === 2;
        case "below":
            return (
                characterLocation.row === OBJECT_LOCATION.row + 1 &&
                characterLocation.col === OBJECT_LOCATION.col
            );
        case "between":
            return locationsEqual(characterLocation, OBJECT_LOCATION);
        case "behind":
            return (
                characterLocation.row === OBJECT_LOCATION.row &&
                characterLocation.col === OBJECT_LOCATION.col
            );
        case "in front of":
            return (
                characterLocation.row === OBJECT_LOCATION.row &&
                characterLocation.col === OBJECT_LOCATION.col
            );
        default:
            return false;
    }
};

export const SpotOnGame = ({
    questions,
    onSettingsRequested,
}: SpotOnGameProps) => {
    const tracking = useExerciseTracking(questions.length);
    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });

    const [characterLocations, setCharacterLocations] = useState<
        Record<string, SpotOnGridLocation>
    >(() =>
        Object.fromEntries(
            questions.map((question) => [question.id, CHARACTER_START]),
        ),
    );

    const questionById = useMemo(
        () =>
            Object.fromEntries(
                questions.map((question) => [question.id, question]),
            ),
        [questions],
    );
    const activeQuestionIdRef = useRef(questions[0]?.id ?? "");

    const sensors = [
        PointerSensor.configure({
            activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 1 }),
            ],
        }),
        KeyboardSensor,
    ];

    const onDragEnd = (event: DragEndEvent) => {
        if (questionState.answerState !== "notAnswered" || event.canceled) {
            return;
        }

        const targetId = event.operation.target?.id;

        if (!targetId) {
            return;
        }

        const parsedLocation = parseCellId(String(targetId));

        if (!parsedLocation) {
            return;
        }

        setCharacterLocations((currentLocations) => ({
            ...currentLocations,
            [activeQuestionIdRef.current]: parsedLocation,
        }));
    };

    const onCheckAnswer = (question: { id: string }) => {
        const spotOnQuestion = questionById[question.id];

        if (!spotOnQuestion) {
            return;
        }

        const currentLocation =
            characterLocations[spotOnQuestion.id] ?? CHARACTER_START;
        const isCorrect = isLocationCorrect(
            currentLocation,
            spotOnQuestion.preposition,
        );

        setQuestionState((currentQuestionState) => ({
            ...currentQuestionState,
            answerState: isCorrect ? "correct" : "incorrect",
        }));
    };

    const onResetQuestion = () => {
        const questionId = activeQuestionIdRef.current;
        const question = questionById[questionId];

        setQuestionState({
            selectedIconIds: [],
            answerState: "notAnswered",
        });

        if (!question) {
            return;
        }

        setCharacterLocations((currentLocations) => ({
            ...currentLocations,
            [questionId]: CHARACTER_START,
        }));
    };

    return (
        <ExerciseLayout
            exerciseId={EXERCISE_METADATA.id}
            actionBarPhase={questionState.answerState}
            questions={questions.map((question) => ({
                id: question.id,
                prompt: question.prompt,
                correctIconIds: [],
            }))}
            answers={questions}
            tracking={tracking}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetQuestion}
            onSettingsRequested={onSettingsRequested}
            showSkip={false}
        >
            {(question) => {
                activeQuestionIdRef.current = question.id;
                const characterLocation =
                    characterLocations[question.id] ?? CHARACTER_START;

                return (
                    <DragDropProvider sensors={sensors} onDragEnd={onDragEnd}>
                        <div className={styles.boardCard}>
                            <div className={styles.grid}>
                                {Array.from(
                                    { length: GRID_ROWS * GRID_COLUMNS },
                                    (_, cellIndex) => {
                                        const row = Math.floor(
                                            cellIndex / GRID_COLUMNS,
                                        );
                                        const col = cellIndex % GRID_COLUMNS;
                                        const cellLocation = { row, col };
                                        const hasObject =
                                            question.preposition === "between"
                                                ? locationsEqual(
                                                      cellLocation,
                                                      BETWEEN_LEFT_OBJECT,
                                                  ) ||
                                                  locationsEqual(
                                                      cellLocation,
                                                      BETWEEN_RIGHT_OBJECT,
                                                  )
                                                : locationsEqual(
                                                      cellLocation,
                                                      OBJECT_LOCATION,
                                                  );
                                        const hasCharacter = locationsEqual(
                                            characterLocation,
                                            cellLocation,
                                        );

                                        return (
                                            <div
                                                key={`${row}-${col}`}
                                                className={styles.gridCell}
                                            >
                                                <DroppableImageZone
                                                    id={toCellId(cellLocation)}
                                                >
                                                    {hasObject ? (
                                                        <img
                                                            className={
                                                                styles.objectImage
                                                            }
                                                            src={
                                                                question.object
                                                                    .imageUrl
                                                            }
                                                            alt={
                                                                question.object
                                                                    .altText ??
                                                                question.object
                                                                    .name
                                                            }
                                                        />
                                                    ) : null}
                                                    {hasCharacter ? (
                                                        <DraggableImage
                                                            id={`character:${question.id}`}
                                                            image={{
                                                                id: question
                                                                    .character
                                                                    .id,
                                                                imageUrl:
                                                                    question
                                                                        .character
                                                                        .imageUrl,
                                                                label: question
                                                                    .character
                                                                    .name,
                                                                altText:
                                                                    question
                                                                        .character
                                                                        .altText,
                                                            }}
                                                            isCorrect={null}
                                                            isSelected={false}
                                                            isDisabled={
                                                                questionState.answerState !==
                                                                "notAnswered"
                                                            }
                                                            isBorderless
                                                            onClick={() => {}}
                                                        />
                                                    ) : null}
                                                </DroppableImageZone>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    </DragDropProvider>
                );
            }}
        </ExerciseLayout>
    );
};

export default SpotOnGame;
