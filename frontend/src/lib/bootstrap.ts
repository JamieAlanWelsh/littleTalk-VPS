/**
 * Exercise Bootstrap Utility
 *
 * Parses exercise configuration from the mount element's data attributes.
 * Called by exercise entry points to load the exercise definition from Django.
 */

import type { MatchingExercisePayload } from './types';

export function getDataExercisePayload(rootElement: HTMLElement): any {
  const payloadJson = rootElement.getAttribute('data-exercise-payload');
  if (!payloadJson) {
    throw new Error('Missing data-exercise-payload attribute on root element');
  }
  return JSON.parse(payloadJson);
}

/**
 * Parses the exercise payload from the root element's data attributes.
 * @param rootElement The DOM element where the exercise is mounted
 * @returns Parsed MatchingExercisePayload
 * @throws Error if required payload data is missing or invalid JSON
 */
export function parseExercisePayload(rootElement: HTMLElement | null): MatchingExercisePayload {
  if (!rootElement) {
    throw new Error('Root element not found for exercise mount');
  }

  const payloadJson = rootElement.getAttribute('data-exercise-payload');
  if (!payloadJson) {
    throw new Error('Missing data-exercise-payload attribute on root element');
  }

  try {
    const payload = JSON.parse(payloadJson) as MatchingExercisePayload;
    
    // Validate required fields
    if (!payload.exerciseId || !payload.title || !payload.prompts || !payload.icons || !payload.pairs) {
      throw new Error('Missing required fields in exercise payload');
    }

    return payload;
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Failed to parse exercise payload: ${e.message}`);
    }
    throw e;
  }
}

/**
 * Serializes an exercise payload to JSON string for passing via data attributes.
 * Used by Django views to convert Python dicts to template-safe JSON strings.
 * @param payload The MatchingExercisePayload to serialize
 * @returns JSON string safe to insert into HTML data attributes
 */
export function serializeExercisePayload(payload: MatchingExercisePayload): string {
  return JSON.stringify(payload);
}
