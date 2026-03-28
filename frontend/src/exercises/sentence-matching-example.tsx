/**
 * Sentence-Matching Exercise Entry Point
 *
 * Mounts the sentence-to-picture matching example exercise to the root element.
 * Loads exercise configuration from the mount element's data attributes.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import '../style.css';
import SentenceToImageMatching2 from './SentenceToImageMatching2';
import { getDataExercisePayload } from '../lib/bootstrap';
import { MatchingExercisePayload2Schema } from '../lib/types';

const mountElement = document.getElementById('exercise-root');

if (!mountElement) {
  console.error('Root element #exercise-root not found');
  document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: 'Root element #exercise-root not found'</div>`;
} else {
  try {
    const payload = MatchingExercisePayload2Schema.parse(getDataExercisePayload(mountElement));

    const root = ReactDOM.createRoot(mountElement);
    root.render(
      <React.StrictMode>
        <SentenceToImageMatching2
          payload={payload}
        />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize exercise:', error);
    mountElement.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}
