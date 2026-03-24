/**
 * Sentence-Matching Exercise Entry Point
 *
 * Mounts the sentence-to-picture matching example exercise to the root element.
 * Loads exercise configuration from the mount element's data attributes.
 */

import 'vite/modulepreload-polyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../style.css';
import SentenceToImageMatching from './SentenceToImageMatching';
import { parseExercisePayload } from '../lib/bootstrap';

const rootElement = document.getElementById('exercise-root');

if (!rootElement) {
  console.error('Root element #exercise-root not found');
} else {
  try {
    const payload = parseExercisePayload(rootElement);

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <SentenceToImageMatching
          payload={payload}
          onComplete={(completedPairs) => {
            console.log(`Exercise completed: ${completedPairs}/${payload.pairs.length} correct`);
          }}
        />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize exercise:', error);
    rootElement.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}
