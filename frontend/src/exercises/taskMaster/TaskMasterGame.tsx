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
import { PoolTray } from "../../components/PoolTray/PoolTray";
import { useExerciseTracking } from "../../hooks";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { QuestionState } from "../../lib/types";
import exerciseData from "./exerciseData.json";
import type { TaskMasterQuestion } from "./types";
import { TaskMasterExerciseDataSchema } from "./types";
import styles from "./TaskMasterGame.module.css";

interface TaskMasterGameProps {
    questions: TaskMasterQuestion[];
    onSettingsRequested?: () => void;
}

const EXERCISE_METADATA = {
    id: "task-master",
};

const GRID_ROWS = 4;
const GRID_COLUMNS = 5;
const POOL_ID = "pool";

const toCellId = (row: number, col: number) => `cell:${row}:${col}`;

const toDragId = (objectId: string) => `object:${objectId}`;

const fromDragId = (dragId: string): string | null => {
    const [prefix, objectId] = dragId.split(":");

    if (prefix !== "object" || !objectId) {
        return null;
    }

    return objectId;
};

const isValidDropTarget = (targetId: string) =>
    targetId === POOL_ID || targetId.startsWith("cell:");

const getPlacedObjectIdForCell = (
    placements: Record<string, string>,
    cellId: string,
): string | null => {
    for (const [objectId, placedCellId] of Object.entries(placements)) {
        if (placedCellId === cellId) {
            return objectId;
        }
    }

    return null;
};

export const TaskMasterGame = ({
    questions,
    onSettingsRequested,
}: TaskMasterGameProps) => {
    const tracking = useExerciseTracking(questions.length);
    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const [placementsByQuestionId, setPlacementsByQuestionId] = useState<
        Record<string, Record<string, string>>
    >(() => Object.fromEntries(questions.map((question) => [question.id, {}])));

    const parsedData = useMemo(
        () => TaskMasterExerciseDataSchema.parse(exerciseData),
        [],
    );

    const objectPicturesById = useMemo(
        () =>
            Object.fromEntries(
                parsedData.objects.map((object) => [
                    object.id,
                    {
                        id: object.id,
                        imageUrl: object.imageUrl,
                        label: object.label,
                        altText: object.label,
                    },
                ]),
            ),
        [parsedData.objects],
    );

    const allObjectIds = useMemo(
        () => parsedData.objects.map((object) => object.id),
        [parsedData.objects],
    );

    const objectIdByImageUrl = useMemo(
        () =>
            Object.fromEntries(
                parsedData.objects.map((object) => [
                    object.imageUrl,
                    object.id,
                ]),
            ),
        [parsedData.objects],
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

        const sourceId = String(event.operation.source?.id ?? "");
        const targetId = String(event.operation.target?.id ?? "");

        if (!sourceId || !targetId || !isValidDropTarget(targetId)) {
            return;
        }

        const objectId = fromDragId(sourceId);

        if (!objectId) {
            return;
        }

        const questionId = activeQuestionIdRef.current;

        setPlacementsByQuestionId((current) => {
            const currentPlacements = current[questionId] ?? {};
            const nextPlacements = { ...currentPlacements };

            if (targetId === POOL_ID) {
                delete nextPlacements[objectId];
            } else {
                const displacedObjectId = getPlacedObjectIdForCell(
                    nextPlacements,
                    targetId,
                );

                if (displacedObjectId) {
                    delete nextPlacements[displacedObjectId];
                }

                nextPlacements[objectId] = targetId;
            }

            return {
                ...current,
                [questionId]: nextPlacements,
            };
        });
    };

    const onCheckAnswer = (question: { id: string }) => {
        const currentQuestion = questionById[question.id];

        if (!currentQuestion) {
            return;
        }

        const targetObjectId = objectIdByImageUrl[currentQuestion.objectUrl];

        if (!targetObjectId) {
            setQuestionState((currentQuestionState) => ({
                ...currentQuestionState,
                answerState: "incorrect",
            }));
            return;
        }

        const placements = placementsByQuestionId[currentQuestion.id] ?? {};
        const placedCellId = placements[targetObjectId];

        const validAnswerCellIds = currentQuestion.answer.map(([row, col]) =>
            toCellId(row, col),
        );
        const isCorrect =
            placedCellId != null && validAnswerCellIds.includes(placedCellId);

        setQuestionState((currentQuestionState) => ({
            ...currentQuestionState,
            answerState: isCorrect ? "correct" : "incorrect",
        }));
    };

    const onResetQuestion = () => {
        const questionId = activeQuestionIdRef.current;

        setQuestionState({
            selectedIconIds: [],
            answerState: "notAnswered",
        });

        setPlacementsByQuestionId((current) => ({
            ...current,
            [questionId]: {},
        }));
    };

    const renderObject = (objectId: string) => {
        const image = objectPicturesById[objectId];

        if (!image) {
            return null;
        }

        return (
            <div className={styles.placedObject}>
                <DraggableImage
                    id={toDragId(objectId)}
                    image={image}
                    isCorrect={null}
                    isSelected={false}
                    isDisabled={questionState.answerState !== "notAnswered"}
                    isBorderless
                    onClick={() => {}}
                />
            </div>
        );
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
                const placements = placementsByQuestionId[question.id] ?? {};
                const poolObjectIds = allObjectIds.filter(
                    (objectId) => placements[objectId] == null,
                );

                return (
                    <div className={styles.board}>
                        <DragDropProvider
                            sensors={sensors}
                            onDragEnd={onDragEnd}
                        >
                            <div className={styles.boardCard}>
                                <img
                                    className={styles.sceneImage}
                                    src={question.image}
                                    alt={question.character}
                                />
                                <div className={styles.gridOverlay}>
                                    {Array.from(
                                        { length: GRID_ROWS * GRID_COLUMNS },
                                        (_, cellIndex) => {
                                            const row = Math.floor(
                                                cellIndex / GRID_COLUMNS,
                                            );
                                            const col =
                                                cellIndex % GRID_COLUMNS;
                                            const cellId = toCellId(row, col);
                                            const placedObjectId =
                                                getPlacedObjectIdForCell(
                                                    placements,
                                                    cellId,
                                                );

                                            return (
                                                <div
                                                    key={`${row}-${col}`}
                                                    className={styles.gridCell}
                                                >
                                                    <DroppableImageZone
                                                        id={cellId}
                                                        className={
                                                            styles.cellZone
                                                        }
                                                    >
                                                        {placedObjectId
                                                            ? renderObject(
                                                                  placedObjectId,
                                                              )
                                                            : null}
                                                    </DroppableImageZone>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>

                            <PoolTray
                                id={POOL_ID}
                                itemIds={poolObjectIds}
                                renderItem={renderObject}
                                getItemLabel={(objectId) =>
                                    objectPicturesById[objectId]?.label
                                }
                            />
                        </DragDropProvider>
                    </div>
                );
            }}
        </ExerciseLayout>
    );
};

export default TaskMasterGame;
