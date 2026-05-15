import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import WhosWhoGame from "./WhosWhoGame";
import WhosWhoSettingsScreen from "./WhosWhoSettingsScreen";
import type { WhosWhoExercisePayload, WhosWhoScenario } from "./types";

const EXERCISE_METADATA = {
    setupTitle: "Who's Who",
    setupSubtitle:
        "Listen to the pronoun and give the correct object to the right person.",
};

interface WhosWhoProps {
    payload: WhosWhoExercisePayload;
}

const pickScenarios = (
    scenarios: WhosWhoScenario[],
    rounds: number,
): WhosWhoScenario[] => {
    const shuffled = [...scenarios];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [
            shuffled[swapIndex],
            shuffled[index],
        ];
    }

    return shuffled.slice(0, Math.min(rounds, shuffled.length));
};

export const WhosWho = ({ payload }: WhosWhoProps) => {
    const [selectedScenarios, setSelectedScenarios] = useState<
        WhosWhoScenario[] | null
    >(null);

    const handleStartExercise = () => {
        setSelectedScenarios(pickScenarios(payload.scenarios, payload.rounds));
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
                    instruction={payload.instruction}
                    modellingTip={payload.modellingTip}
                />
            </ExerciseStartScreen>
        );
    }

    return (
        <WhosWhoGame
            selectedScenarios={selectedScenarios}
            items={payload.items}
            targets={payload.targets}
            onSettingsRequested={() => setSelectedScenarios(null)}
        />
    );
};

export default WhosWho;
