import type { DragEndEvent } from "@dnd-kit/abstract";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import {
    DragDropProvider,
    KeyboardSensor,
    PointerSensor,
} from "@dnd-kit/react";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { DraggableImage } from "../../components/DraggableImage/DraggableImage";
import { DroppableImageZone } from "../../components/DroppableImageZone/DroppableImageZone";
import { PoolTray } from "../../components/PoolTray/PoolTray";
import { useExerciseTracking } from "../../hooks";
import useAudio from "../../hooks/useAudio";
import ExerciseLayout from "../../layouts/exerciseLayout/ExerciseLayout";
import type { ExerciseDifficulty, QuestionState } from "../../lib/types";
import exerciseData from "./exerciseData.json";
import { TASK_MASTER_GRID_COLUMNS, TASK_MASTER_GRID_ROWS } from "./constants";
import type { TaskMasterQuestion } from "./types";
import { TaskMasterExerciseDataSchema } from "./types";
import styles from "./TaskMasterGame.module.css";

interface TaskMasterGameProps {
    questions: TaskMasterQuestion[];
}

const EXERCISE_METADATA = {
    id: "task-master",
};

const GRID_ROWS = TASK_MASTER_GRID_ROWS;
const GRID_COLUMNS = TASK_MASTER_GRID_COLUMNS;
const POOL_ID = "pool";
const DEPTH_MIN_SCALE = 0.45;

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

const getSceneIdFromQuestionId = (questionId: string): string => {
    const [sceneId] = questionId.split("-");
    return sceneId ?? "";
};

const getDepthScaleForRow = (row: number): number => {
    if (GRID_ROWS <= 1) {
        return 1;
    }

    const clampedRow = Math.max(0, Math.min(row, GRID_ROWS - 1));
    const depthProgress = clampedRow / (GRID_ROWS - 1);

    return DEPTH_MIN_SCALE + depthProgress * (1 - DEPTH_MIN_SCALE);
};

const buildScenePlacements = (
    placementsByQuestionId: Record<string, Record<string, string>>,
    sceneQuestionIds: string[],
) => {
    const scenePlacements: Record<string, string> = {};

    for (const sceneQuestionId of sceneQuestionIds) {
        const placements = placementsByQuestionId[sceneQuestionId] ?? {};

        for (const [objectId, cellId] of Object.entries(placements)) {
            scenePlacements[objectId] = cellId;
        }
    }

    return scenePlacements;
};

export const TaskMasterGame = ({ questions }: TaskMasterGameProps) => {
    const tracking = useExerciseTracking(questions.length);
    const { play } = useAudio();
    const [questionState, setQuestionState] = useState<QuestionState>({
        selectedIconIds: [],
        answerState: "notAnswered",
    });
    const [isDragging, setIsDragging] = useState(false);
    const [lockedQuestionIds, setLockedQuestionIds] = useState<Set<string>>(
        () => new Set(),
    );
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
                        sfxUrl: object.imageUrl.match(/\.webp$/i)
                            ? object.imageUrl.replace(/\.webp$/i, ".wav")
                            : undefined,
                    },
                ]),
            ),
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

    const sceneObjectIdsBySceneId = useMemo(() => {
        const map: Record<string, string[]> = {};

        for (const question of questions) {
            const sceneId = getSceneIdFromQuestionId(question.id);
            const objectId = objectIdByImageUrl[question.objectUrl];

            if (!sceneId || !objectId) {
                continue;
            }

            const currentSceneObjectIds = map[sceneId] ?? [];

            if (!currentSceneObjectIds.includes(objectId)) {
                currentSceneObjectIds.push(objectId);
            }

            map[sceneId] = currentSceneObjectIds;
        }

        return map;
    }, [questions, objectIdByImageUrl]);

    const sceneQuestionIdsBySceneId = useMemo(() => {
        const map: Record<string, string[]> = {};

        for (const question of questions) {
            const sceneId = getSceneIdFromQuestionId(question.id);

            if (!sceneId) {
                continue;
            }

            const currentSceneQuestionIds = map[sceneId] ?? [];

            if (!currentSceneQuestionIds.includes(question.id)) {
                currentSceneQuestionIds.push(question.id);
            }

            map[sceneId] = currentSceneQuestionIds;
        }

        return map;
    }, [questions]);

    const questionIdByObjectId = useMemo(() => {
        const map: Record<string, string> = {};

        for (const question of questions) {
            const objectId = objectIdByImageUrl[question.objectUrl];

            if (!objectId) {
                continue;
            }

            map[objectId] = question.id;
        }

        return map;
    }, [questions, objectIdByImageUrl]);

    const activeQuestionIdRef = useRef(questions[0]?.id ?? "");
    const difficulty: ExerciseDifficulty = {
        level: 1,
        label: "Standard",
    };

    const sensors = [
        PointerSensor.configure({
            activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 1 }),
            ],
        }),
        KeyboardSensor,
    ];

    const onDragStart = () => {
        if (questionState.answerState !== "notAnswered") {
            return;
        }

        setIsDragging(true);
    };

    const onDragEnd = (event: DragEndEvent) => {
        setIsDragging(false);

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
        const sourceQuestionId = questionIdByObjectId[objectId] ?? questionId;
        const activeSceneId = getSceneIdFromQuestionId(questionId);
        const sceneQuestionIds = sceneQuestionIdsBySceneId[activeSceneId] ?? [];

        if (lockedQuestionIds.has(sourceQuestionId)) {
            return;
        }

        setPlacementsByQuestionId((current) => {
            const nextByQuestionId = { ...current };
            const sourcePlacements = {
                ...(nextByQuestionId[sourceQuestionId] ?? {}),
            };

            if (targetId === POOL_ID) {
                delete sourcePlacements[objectId];

                nextByQuestionId[sourceQuestionId] = sourcePlacements;

                return nextByQuestionId;
            } else {
                const scenePlacements = buildScenePlacements(
                    nextByQuestionId,
                    sceneQuestionIds,
                );
                const displacedObjectId = getPlacedObjectIdForCell(
                    scenePlacements,
                    targetId,
                );

                if (displacedObjectId) {
                    const displacedQuestionId =
                        questionIdByObjectId[displacedObjectId];

                    if (
                        displacedQuestionId &&
                        lockedQuestionIds.has(displacedQuestionId)
                    ) {
                        return current;
                    }

                    if (displacedQuestionId) {
                        const displacedPlacements = {
                            ...(nextByQuestionId[displacedQuestionId] ?? {}),
                        };

                        delete displacedPlacements[displacedObjectId];
                        nextByQuestionId[displacedQuestionId] =
                            displacedPlacements;
                    }
                }

                sourcePlacements[objectId] = targetId;
            }

            nextByQuestionId[sourceQuestionId] = sourcePlacements;

            return nextByQuestionId;
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

        if (isCorrect) {
            setLockedQuestionIds((currentLockedQuestionIds) => {
                if (currentLockedQuestionIds.has(currentQuestion.id)) {
                    return currentLockedQuestionIds;
                }

                const nextLockedQuestionIds = new Set(currentLockedQuestionIds);
                nextLockedQuestionIds.add(currentQuestion.id);
                return nextLockedQuestionIds;
            });
        }

        setQuestionState((currentQuestionState) => ({
            ...currentQuestionState,
            answerState: isCorrect ? "correct" : "incorrect",
        }));
    };

    const onResetQuestion = () => {
        const questionId = activeQuestionIdRef.current;
        const isQuestionLocked = lockedQuestionIds.has(questionId);

        setQuestionState({
            selectedIconIds: [],
            answerState: "notAnswered",
        });

        if (isQuestionLocked) {
            return;
        }

        setPlacementsByQuestionId((current) => ({
            ...current,
            [questionId]: {},
        }));
    };

    const playObjectSfx = (objectId: string) => {
        const objectImage = objectPicturesById[objectId];

        if (!objectImage?.sfxUrl) {
            return;
        }

        play(objectImage.sfxUrl);
    };

    const renderObject = (
        objectId: string,
        options?: { isLocked?: boolean; depthScale?: number },
    ) => {
        const image = objectPicturesById[objectId];

        if (!image) {
            return null;
        }

        const isLocked = options?.isLocked === true;
        const depthScale = options?.depthScale;

        const draggable = (
            <DraggableImage
                id={toDragId(objectId)}
                image={image}
                isCorrect={null}
                isSelected={false}
                isDisabled={
                    questionState.answerState !== "notAnswered" || isLocked
                }
                isBorderless
                onClick={() => {
                    playObjectSfx(objectId);
                }}
                onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                        playObjectSfx(objectId);
                    }
                }}
            />
        );

        if (depthScale == null) {
            return draggable;
        }

        return (
            <div
                className={(styles as Record<string, string>).placedObject}
                style={
                    {
                        "--taskmaster-depth-scale": depthScale,
                    } as CSSProperties
                }
            >
                {draggable}
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
            difficulty={difficulty}
            onCheckAnswer={onCheckAnswer}
            onResetQuestion={onResetQuestion}
            showSkip={false}
        >
            {(question) => {
                activeQuestionIdRef.current = question.id;
                const sceneId = getSceneIdFromQuestionId(question.id);
                const sceneObjectIds = sceneObjectIdsBySceneId[sceneId] ?? [];
                const sceneQuestionIds =
                    sceneQuestionIdsBySceneId[sceneId] ?? [];
                const scenePlacements = buildScenePlacements(
                    placementsByQuestionId,
                    sceneQuestionIds,
                );
                const lockedObjectIds = new Set(
                    sceneQuestionIds
                        .filter((sceneQuestionId) =>
                            lockedQuestionIds.has(sceneQuestionId),
                        )
                        .map((sceneQuestionId) => {
                            const sceneQuestion = questionById[sceneQuestionId];

                            if (!sceneQuestion) {
                                return "";
                            }

                            return (
                                objectIdByImageUrl[sceneQuestion.objectUrl] ??
                                ""
                            );
                        })
                        .filter(Boolean),
                );
                const poolObjectIds = sceneObjectIds.filter(
                    (objectId) => scenePlacements[objectId] == null,
                );

                return (
                    <div className={styles.board}>
                        <DragDropProvider
                            sensors={sensors}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                        >
                            <div
                                className={`${styles.boardCard} ${isDragging ? styles.dragging : ""}`.trim()}
                            >
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
                                                    scenePlacements,
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
                                                                  {
                                                                      isLocked:
                                                                          lockedObjectIds.has(
                                                                              placedObjectId,
                                                                          ),
                                                                      depthScale:
                                                                          getDepthScaleForRow(
                                                                              row,
                                                                          ),
                                                                  },
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
