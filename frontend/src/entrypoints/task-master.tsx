/**
 * Task Master Exercise Entry Point
 *
 * Mounts the Task Master exercise to the root element.
 * Loads exercise configuration from a JSON file.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../style.css";
import { LearnerContextProvider } from "../contexts/LearnerContext";
import TaskMaster from "../exercises/taskMaster/TaskMaster";

const queryClient = new QueryClient();

const mountElement = document.getElementById("exercise-root");

if (!mountElement) {
    console.error("Root element #exercise-root not found");
    document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: 'Root element #exercise-root not found'</div>`;
} else {
    const learnerUUID = mountElement.getAttribute("data-learner-uuid") || null;

    const root = ReactDOM.createRoot(mountElement);
    root.render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <LearnerContextProvider learnerUUID={learnerUUID}>
                    <TaskMaster />
                </LearnerContextProvider>
            </QueryClientProvider>
        </React.StrictMode>,
    );
}
