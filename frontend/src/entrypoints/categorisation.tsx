/**
 * Categorisation Exercise Entry Point
 *
 * Mounts the categorisation exercise to the root element.
 * Loads exercise configuration from a JSON file.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../style.css";
import Categorisation from "../exercises/categorisation/Categorisation";
import { CategorisationExercisePayloadSchema } from "../exercises/categorisation/types";
import { LearnerContextProvider } from "../contexts/LearnerContext";
import exerciseData from "../exercises/categorisation/exerciseData.json";

// Create a QueryClient instance
const queryClient = new QueryClient();

const mountElement = document.getElementById("exercise-root");

if (!mountElement) {
    console.error("Root element #exercise-root not found");
    document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: 'Root element #exercise-root not found'</div>`;
} else {
    try {
        // Parse and validate exercise data
        const payload = CategorisationExercisePayloadSchema.parse(exerciseData);

        // Extract learnerUUID from the exercise-root div's data attribute
        const learnerUUID =
            mountElement?.getAttribute("data-learner-uuid") || null;

        const root = ReactDOM.createRoot(mountElement);
        root.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <LearnerContextProvider learnerUUID={learnerUUID}>
                        <Categorisation payload={payload} />
                    </LearnerContextProvider>
                </QueryClientProvider>
            </React.StrictMode>,
        );
    } catch (error) {
        console.error("Failed to initialize exercise:", error);
        mountElement.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: ${error instanceof Error ? error.message : String(error)}</div>`;
    }
}
