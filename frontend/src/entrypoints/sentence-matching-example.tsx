/**
 * Sentence-Matching Exercise Entry Point
 *
 * Mounts the sentence-to-picture matching example exercise to the root element.
 * Loads exercise configuration from a JSON file.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../style.css";
import SentenceToImageMatching from "../exercises/sentanceMatching/SentenceToImageMatching";
import { loadExerciseDataFromJSON } from "../lib/bootstrap";
import { LearnerContextProvider } from "../contexts/LearnerContext";
import exerciseData from "../exercises/sentanceMatching/exerciseData.json";

// Create a QueryClient instance
const queryClient = new QueryClient();

const mountElement = document.getElementById("exercise-root");

if (!mountElement) {
  console.error("Root element #exercise-root not found");
  document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: 'Root element #exercise-root not found'</div>`;
} else {
  try {
    const payload = loadExerciseDataFromJSON(exerciseData);

    // Extract learnerUUID from the exercise-root div's data attribute
    const learnerUUID = mountElement?.getAttribute("data-learner-uuid") || null;

    const root = ReactDOM.createRoot(mountElement);
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <LearnerContextProvider learnerUUID={learnerUUID}>
            <SentenceToImageMatching payload={payload} />
          </LearnerContextProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Failed to initialize exercise:", error);
    mountElement.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}
