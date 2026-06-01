import { useEffect, useState } from "react";
import {
    WhatHappensNextChoiceCounts,
    type WhatHappensNextChoiceCount,
} from "./types";
import styles from "./WhatHappensNextSettingsScreen.module.css";

interface WhatHappensNextSettingsScreenProps {
    choiceCount: WhatHappensNextChoiceCount;
    onSetChoiceCount: (choiceCount: WhatHappensNextChoiceCount) => void;
}

export const WhatHappensNextSettingsScreen = ({
    choiceCount,
    onSetChoiceCount,
}: WhatHappensNextSettingsScreenProps) => {
    const [selectedChoiceCount, setSelectedChoiceCount] =
        useState<WhatHappensNextChoiceCount>(choiceCount);

    useEffect(() => {
        onSetChoiceCount(selectedChoiceCount);
    }, [onSetChoiceCount, selectedChoiceCount]);

    return (
        <div className={styles.section}>
            <div className={styles.optionsCard}>
                <label
                    htmlFor="what-happens-next-choice-count"
                    className={styles.sectionLabel}
                >
                    Choices per round
                </label>
                <select
                    id="what-happens-next-choice-count"
                    value={selectedChoiceCount}
                    onChange={(event) =>
                        setSelectedChoiceCount(
                            Number(
                                event.target.value,
                            ) as WhatHappensNextChoiceCount,
                        )
                    }
                    className={styles.optionsSelect}
                >
                    {WhatHappensNextChoiceCounts.map((count) => (
                        <option key={count} value={count}>
                            {count} choices
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default WhatHappensNextSettingsScreen;
