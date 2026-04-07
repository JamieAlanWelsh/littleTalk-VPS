/**
 * Exercise Bootstrap Utility
 *
 * Parses exercise configuration from the mount element's data attributes.
 * Called by exercise entry points to load the exercise definition from Django.
 */

import type {
  MatchingExercisePayload,
  MatchingExercisePayload2,
} from "./types";
import { MatchingExercisePayload2Schema } from "./types";

export function getDataExercisePayload(rootElement: HTMLElement): any {
  const payloadJson = rootElement.getAttribute("data-exercise-payload");
  if (!payloadJson) {
    throw new Error("Missing data-exercise-payload attribute on root element");
  }
  return JSON.parse(payloadJson);
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
