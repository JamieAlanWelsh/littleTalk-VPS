import { useEffect, useState } from "react";
import Button from "../../components/Button/Button";
import styles from "../../layouts/exerciseStartScreen/ExerciseStartScreen.module.css";
import type { WhatsInTheBagOptions } from "./types";

interface WhatsInTheBagSettingsScreenProps {
    onSetOptions: (options: WhatsInTheBagOptions) => void;
}

export const WhatsInTheBagSettingsScreen = ({
    onSetOptions,
}: WhatsInTheBagSettingsScreenProps) => {
    const [selectedNumOptions, setSelectedNumOptions] = useState<1 | 2 | 3>(3);
    const optionCounts: Array<1 | 2 | 3> = [1, 2, 3];

    useEffect(() => {
        onSetOptions({ numberOfOptions: selectedNumOptions });
    }, [selectedNumOptions, onSetOptions]);

    return (
        <>
            <h3 className={styles.sectionTitle}>Number of word options:</h3>
            <div className={styles.optionsList}>
                {optionCounts.map((count) => (
                    <Button
                        key={count}
                        variant={
                            selectedNumOptions === count
                                ? "primary"
                                : "secondary"
                        }
                        onClick={() => setSelectedNumOptions(count)}
                        width={"100%"}
                        label={`${count} ${count === 1 ? "option" : "options"}`}
                    />
                ))}
            </div>
        </>
    );
};

export default WhatsInTheBagSettingsScreen;
