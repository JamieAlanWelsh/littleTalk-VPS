/**
 * Exercise Bootstrap Utility
 *
 * Parses exercise configuration from the mount element's data attributes.
 * Called by exercise entry points to load the exercise definition from Django.
 */

import type { MatchingExercisePayload2 } from "./types";
import { MatchingExercisePayload2Schema } from "./types";

export interface ExerciseGroupLearner {
    id: number;
    name: string;
    avatar_color: string;
    avatar_image_url: string;
}

export interface ExerciseMountContext {
    learnerUUID: string | null;
    groupId: number | null;
    groupLearners: ExerciseGroupLearner[];
}

export function getDataExercisePayload(rootElement: HTMLElement): unknown {
    const payloadJson = rootElement.getAttribute("data-exercise-payload");
    if (!payloadJson) {
        throw new Error(
            "Missing data-exercise-payload attribute on root element",
        );
    }
    return JSON.parse(payloadJson);
}

export function getExerciseMountContext(
    rootElement: HTMLElement,
): ExerciseMountContext {
    const learnerUUID = rootElement.getAttribute("data-learner-uuid") || null;
    const groupIdAttribute = rootElement.getAttribute("data-group-id");
    const groupLearnersJson = rootElement.getAttribute("data-group-learners");

    let groupId: number | null = null;
    if (groupIdAttribute) {
        const parsedGroupId = Number(groupIdAttribute);
        groupId = Number.isInteger(parsedGroupId) ? parsedGroupId : null;
    }

    let groupLearners: ExerciseGroupLearner[] = [];
    if (groupLearnersJson) {
        try {
            const parsedGroupLearners = JSON.parse(
                groupLearnersJson,
            ) as unknown;
            if (Array.isArray(parsedGroupLearners)) {
                groupLearners = parsedGroupLearners.filter(
                    (entry): entry is ExerciseGroupLearner =>
                        Boolean(
                            entry &&
                            typeof entry === "object" &&
                            typeof (entry as ExerciseGroupLearner).id ===
                                "number" &&
                            typeof (entry as ExerciseGroupLearner).name ===
                                "string" &&
                            typeof (entry as ExerciseGroupLearner)
                                .avatar_color === "string" &&
                            typeof (entry as ExerciseGroupLearner)
                                .avatar_image_url === "string",
                        ),
                );
            }
        } catch {
            groupLearners = [];
        }
    }

    return {
        learnerUUID,
        groupId,
        groupLearners,
    };
}

export function resolveSessionRounds(
    defaultRounds: number,
    learnerCount: number,
): number {
    if (!Number.isFinite(defaultRounds) || defaultRounds <= 0) {
        return defaultRounds;
    }

    if (!Number.isFinite(learnerCount) || learnerCount <= 0) {
        return defaultRounds;
    }

    return Math.max(defaultRounds, learnerCount * 2);
}

export function applyGroupRoundScaling<T extends Record<string, unknown>>(
    payload: T,
    learnerCount: number,
): T {
    const roundsValue = (payload as { rounds?: unknown }).rounds;
    if (typeof roundsValue !== "number") {
        return payload;
    }

    return {
        ...payload,
        rounds: resolveSessionRounds(roundsValue, learnerCount),
    } as T;
}

/**
 * Loads and validates exercise data from a JSON module.
 *
 * @param jsonData - Imported JSON data object
 * @returns Validated exercise payload
 * @throws Error if JSON fails schema validation
 */
export function loadExerciseDataFromJSON(
    jsonData: unknown,
): MatchingExercisePayload2 {
    try {
        const validated = MatchingExercisePayload2Schema.parse(jsonData);
        return validated;
    } catch (error) {
        throw new Error(
            `Invalid exercise data: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}
