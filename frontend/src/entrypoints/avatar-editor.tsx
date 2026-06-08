import React from "react";
import ReactDOM from "react-dom/client";

import AvatarEditor, {
    type AvatarCharacter,
} from "../components/AvatarEditor/AvatarEditor";

const mountElement = document.getElementById("avatar-root");

const parseJsonScript = <T,>(elementId: string): T => {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Missing JSON data element: ${elementId}`);
    }

    return JSON.parse(element.textContent || "null") as T;
};

if (!mountElement) {
    console.error("Root element #avatar-root not found");
    document.body.innerHTML =
        '<div style="padding: 2rem; color: red;">Error loading avatar editor: Root element #avatar-root not found</div>';
} else {
    try {
        const learnerUUID =
            mountElement.getAttribute("data-learner-uuid") || "";
        const learnerName =
            mountElement.getAttribute("data-learner-name") || "Learner";
        const saveUrl = mountElement.getAttribute("data-save-url") || "";
        const backUrl =
            mountElement.getAttribute("data-back-url") || "/profile/";
        const initialCharacterId =
            mountElement.getAttribute("data-current-character") || "";
        const initialColor =
            mountElement.getAttribute("data-current-color") || "#DEE2E6";

        if (!learnerUUID || !saveUrl) {
            throw new Error("Missing learner UUID or save URL.");
        }

        const characters = parseJsonScript<AvatarCharacter[]>(
            "avatar-characters-data",
        );
        const colors = parseJsonScript<string[]>("avatar-colors-data");

        const root = ReactDOM.createRoot(mountElement);
        root.render(
            <React.StrictMode>
                <AvatarEditor
                    learnerName={learnerName}
                    characters={characters}
                    colors={colors}
                    initialCharacterId={initialCharacterId}
                    initialColor={initialColor}
                    saveUrl={saveUrl}
                    backUrl={backUrl}
                />
            </React.StrictMode>,
        );
    } catch (error) {
        console.error("Failed to initialize avatar editor:", error);
        mountElement.innerHTML = `<div style="padding: 2rem; color: red;">Error loading avatar editor: ${error instanceof Error ? error.message : String(error)}</div>`;
    }
}
