import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../style.css";
import { LearnerContextProvider } from "../contexts/LearnerContext";
import StoryTrain from "../exercises/story_train/StoryTrain";
import advancedExerciseData from "../exercises/story_train/exerciseData.advanced.json";
import exerciseData from "../exercises/story_train/exerciseData.json";
import { StoryTrainExercisePayloadSchema } from "../exercises/story_train/types";

const queryClient = new QueryClient();

const getExerciseData = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const variant = queryParams.get("variant");

    if (variant === "advanced") {
        return advancedExerciseData;
    }

    return exerciseData;
};

const mountElement = document.getElementById("exercise-root");

if (!mountElement) {
    console.error("Root element #exercise-root not found");
    document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: 'Root element #exercise-root not found'</div>`;
} else {
    try {
        const payload =
            StoryTrainExercisePayloadSchema.parse(getExerciseData());
        const learnerUUID =
            mountElement.getAttribute("data-learner-uuid") || null;

        const root = ReactDOM.createRoot(mountElement);
        root.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <LearnerContextProvider learnerUUID={learnerUUID}>
                        <StoryTrain payload={payload} />
                    </LearnerContextProvider>
                </QueryClientProvider>
            </React.StrictMode>,
        );
    } catch (error) {
        console.error("Failed to initialize exercise:", error);
        mountElement.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: ${error instanceof Error ? error.message : String(error)}</div>`;
    }
}
