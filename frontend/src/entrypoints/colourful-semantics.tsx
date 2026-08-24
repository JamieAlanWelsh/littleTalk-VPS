import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../style.css";
import { LearnerContextProvider } from "../contexts/LearnerContext";
import { GroupContextProvider } from "../contexts/GroupContext";
import ColourfulSemanticsExercise from "../exercises/colourfulSemantics/ColourfulSemantics";
import { getExerciseMountContext } from "../lib/bootstrap";
import {
    getColourfulSemanticsVariantData,
    resolveColourfulSemanticsVariantId,
} from "../exercises/colourfulSemantics/variantData";

const queryClient = new QueryClient();
const mountElement = document.getElementById("exercise-root");

if (!mountElement) {
    console.error("Root element #exercise-root not found");
    document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading exercise: 'Root element #exercise-root not found'</div>`;
} else {
    try {
        const variantId = resolveColourfulSemanticsVariantId(
            new URLSearchParams(window.location.search).get("variant"),
        );
        const { payload, variant } =
            getColourfulSemanticsVariantData(variantId);
        const { learnerUUID, groupId, groupLearners } =
            getExerciseMountContext(mountElement);

        const root = ReactDOM.createRoot(mountElement);
        root.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <GroupContextProvider
                        groupId={groupId}
                        groupLearners={groupLearners}
                    >
                        <LearnerContextProvider learnerUUID={learnerUUID}>
                            <ColourfulSemanticsExercise
                                payload={payload}
                                variant={variant}
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
