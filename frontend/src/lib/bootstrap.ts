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
