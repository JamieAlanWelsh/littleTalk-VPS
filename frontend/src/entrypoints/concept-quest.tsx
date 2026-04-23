/**
 * Concept Quest entry point
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../style.css";
import { LearnerContextProvider } from "../contexts/LearnerContext";
import ConceptQuestExercise from "../exercises/conceptQuest/ConceptQuest";
import exerciseData from "../exercises/conceptQuest/exerciseData.json";
import { ConceptQuestPayloadSchema } from "../lib/types";

const queryClient = new QueryClient();
const mountElement = document.getElementById("exercise-root");

if (!mountElement) {
  console.error("Root element #exercise-root not found");
  document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: 'Root element #exercise-root not found'</div>`;
} else {
  try {
    const payload = ConceptQuestPayloadSchema.parse(exerciseData);
    const learnerUUID = mountElement.getAttribute("data-learner-uuid") || null;

    const root = ReactDOM.createRoot(mountElement);
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <LearnerContextProvider learnerUUID={learnerUUID}>
            <ConceptQuestExercise payload={payload} />
          </LearnerContextProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Failed to initialize exercise:", error);
    mountElement.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}
