/**
 * Sentence-Matching Exercise Entry Point
 *
 * Mounts the sentence-to-picture matching example exercise to the root element.
 * Loads exercise configuration from the mount element's data attributes.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../style.css";
import SentenceToImageMatching from "./SentenceToImageMatching";
import { getDataExercisePayload } from "../lib/bootstrap";
import { MatchingExercisePayload2Schema } from "../lib/types";
import { LearnerContextProvider } from "../contexts/LearnerContext";

// Create a QueryClient instance
const queryClient = new QueryClient();

const mountElement = document.getElementById("exercise-root");

if (!mountElement) {
  console.error("Root element #exercise-root not found");
  document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: 'Root element #exercise-root not found'</div>`;
} else {
  try {
    const payload = MatchingExercisePayload2Schema.parse(
      getDataExercisePayload(mountElement),
    );

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
