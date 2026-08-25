import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../style.css";
import { LearnerContextProvider } from "../contexts/LearnerContext";
import { GroupContextProvider } from "../contexts/GroupContext";
import {
    applyGroupRoundScaling,
    getExerciseMountContext,
} from "../lib/bootstrap";
import StoryTrain from "../exercises/storyTrain/StoryTrain";
import advancedExerciseData from "../exercises/storyTrain/exerciseData.advanced.json";
import exerciseData from "../exercises/storyTrain/exerciseData.json";
import { StoryTrainExercisePayloadSchema } from "../exercises/storyTrain/types";

const queryClient = new QueryClient();

const resolveStoryTrainVariantId = (): "standard" | "advanced" => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get("variant") === "advanced" ? "advanced" : "standard";
};

const getExerciseData = () => {
    const variant = resolveStoryTrainVariantId();

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
        const variantId = resolveStoryTrainVariantId();
        const { learnerUUID, groupId, groupLearners } =
            getExerciseMountContext(mountElement);
        const adjustedPayload = applyGroupRoundScaling(
            payload,
            groupLearners.length,
        );

        const root = ReactDOM.createRoot(mountElement);
        root.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <GroupContextProvider
                        groupId={groupId}
                        groupLearners={groupLearners}
                    >
                        <LearnerContextProvider learnerUUID={learnerUUID}>
                            <StoryTrain
                                payload={adjustedPayload}
                                variantId={variantId}
                            />
                        </LearnerContextProvider>
                    </GroupContextProvider>
                </QueryClientProvider>
            </React.StrictMode>,
        );
    } catch (error) {
        console.error("Failed to initialize exercise:", error);
        mountElement.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: ${error instanceof Error ? error.message : String(error)}</div>`;
    }
}
