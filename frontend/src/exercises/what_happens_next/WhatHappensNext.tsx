import { useState } from "react";
import ExerciseStartScreen from "../../layouts/exerciseStartScreen/ExerciseStartScreen";
import WhatHappensNextGame from "./WhatHappensNextGame";
import type { WhatHappensNextPayload } from "./types";

const EXERCISE_METADATA = {
    setupTitle: "What Happens Next?",
    setupSubtitle: "Look at the picture and choose what happens next.",
};

interface WhatHappensNextProps {
    payload: WhatHappensNextPayload;
}

export const WhatHappensNext = ({ payload }: WhatHappensNextProps) => {
    const [hasStarted, setHasStarted] = useState(false);

    if (!hasStarted) {
        return (
            <ExerciseStartScreen
                title={EXERCISE_METADATA.setupTitle}
                subtitle={EXERCISE_METADATA.setupSubtitle}
                onStart={() => setHasStarted(true)}
                startButtonLabel="Start"
            >
                <div
                    style={{
                        display: "grid",
                        gap: "0.75rem",
                        color: "var(--font-color)",
                    }}
                >
                    <p style={{ margin: 0 }}>
                        Look at each picture and think about what happens next.
                    </p>
                    <p style={{ margin: 0 }}>
                        Choose one answer, then press Check.
                    </p>
                </div>
            </ExerciseStartScreen>
        );
    }

    return (
        <WhatHappensNextGame
            payload={payload}
            onSettingsRequested={() => setHasStarted(false)}
        />
    );
};

export default WhatHappensNext;
