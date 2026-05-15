import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import WhosWhoGame from "./WhosWhoGame";
import WhosWhoSettingsScreen from "./WhosWhoSettingsScreen";
import {
    WhosWhoPronouns,
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
    selectedPronouns: [...WhosWhoPronouns],
};

interface WhosWhoProps {
    payload: WhosWhoExercisePayload;
}

interface SelectedScenario extends WhosWhoScenario {
    selectionId: string;
}

const shuffleItems = <T,>(items: T[]): T[] => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [
            shuffled[swapIndex],
            shuffled[index],
        ];
    }

    return shuffled;
};

const pickScenarios = (
    scenarios: WhosWhoScenario[],
    rounds: number,
    selectedPronouns: WhosWhoSettings["selectedPronouns"],
): SelectedScenario[] => {
    const filteredScenarios = scenarios.filter((scenario) =>
        selectedPronouns.includes(scenario.pronoun),
    );
    const sourceScenarios =
        filteredScenarios.length > 0 ? filteredScenarios : scenarios;

    if (sourceScenarios.length === 0) {
        return [];
    }

    const selectedScenarios: SelectedScenario[] = [];
    let selectionIndex = 0;

    while (selectedScenarios.length < rounds) {
        const shuffledScenarios = shuffleItems(sourceScenarios);

        shuffledScenarios.forEach((scenario) => {
            if (selectedScenarios.length < rounds) {
                selectedScenarios.push({
                    ...scenario,
                    selectionId: `${scenario.id}-${selectionIndex}`,
                });
                selectionIndex += 1;
            }
        });
    }

    return selectedScenarios;
};

export const WhosWho = ({ payload }: WhosWhoProps) => {
    const [selectedScenarios, setSelectedScenarios] = useState<
        SelectedScenario[] | null
    >(null);
    const [options, setOptions] = useState<WhosWhoSettings>(DEFAULT_OPTIONS);

    const handleStartExercise = () => {
        setSelectedScenarios(
            pickScenarios(
                payload.scenarios,
                payload.rounds,
                options.selectedPronouns,
            ),
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
