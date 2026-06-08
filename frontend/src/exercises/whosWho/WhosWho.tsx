import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import WhosWhoGame from "./WhosWhoGame";
import WhosWhoSettingsScreen from "./WhosWhoSettingsScreen";
import { generateWhosWhoScenarios } from "./scenarioGenerator";
import {
    type WhosWhoExercisePayload,
    type WhosWhoScenario,
    type WhosWhoSettings,
} from "./types";

const EXERCISE_METADATA = {
    setupTitle: "Who's Who",
    setupSubtitle:
        "Choose which pronouns to practise and how many objects to show.",
};

const DEFAULT_OPTIONS: WhosWhoSettings = {
    choiceCount: 3,
    selectedPronouns: ["he", "she"],
};

interface WhosWhoProps {
    payload: WhosWhoExercisePayload;
}

interface SelectedScenario extends WhosWhoScenario {
    selectionId: string;
}

export const WhosWho = ({ payload }: WhosWhoProps) => {
    const [selectedScenarios, setSelectedScenarios] = useState<
        SelectedScenario[] | null
    >(null);
    const [options, setOptions] = useState<WhosWhoSettings>(DEFAULT_OPTIONS);

    const handleStartExercise = () => {
        const generatedScenarios = generateWhosWhoScenarios({
            payload,
            rounds: payload.rounds,
            selectedPronouns: options.selectedPronouns,
            choiceCount: options.choiceCount,
        });

        setSelectedScenarios(
            generatedScenarios.map((scenario, index) => ({
                ...scenario,
                selectionId: `${scenario.id}-${index}`,
            })),
        );
    };

    if (!selectedScenarios) {
        return (
            <ExerciseStartScreen
                title={EXERCISE_METADATA.setupTitle}
                subtitle={EXERCISE_METADATA.setupSubtitle}
                onStart={handleStartExercise}
                startButtonLabel="Start"
            >
                <WhosWhoSettingsScreen
                    options={options}
                    onSetOptions={setOptions}
                />
            </ExerciseStartScreen>
        );
    }

    return (
        <WhosWhoGame
            settings={options}
            selectedScenarios={selectedScenarios}
            items={payload.items}
            targets={payload.targets}
            onSettingsRequested={() => setSelectedScenarios(null)}
        />
    );
};

export default WhosWho;
