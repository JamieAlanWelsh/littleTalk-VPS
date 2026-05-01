import { useEffect } from "react";
import { getMaxOptionsForPreset, getSlotsForPreset } from "./configureScene";
import styles from "./ColourfulSemanticsSettingsScreen.module.css";
import type {
    ColourfulSemanticsOptions,
    ColourfulSemanticsPayload,
    ColourfulSemanticsPresetId,
    ColourfulSemanticsSlot,
} from "./types";

const PRESET_OPTIONS: Array<{
    id: ColourfulSemanticsPresetId;
    label: string;
}> = [
    { id: "subject", label: "Subject" },
    { id: "verb", label: "Verb" },
    { id: "subject-verb", label: "Subject + Verb" },
    { id: "subject-verb-object", label: "Subject + Verb + Object" },
    {
        id: "subject-verb-object-location",
        label: "Subject + Verb + Object + Location",
    },
];

const SLOT_COLOURS: Record<ColourfulSemanticsSlot, string> = {
    who: "#FF9D2D",
    doing: "#FFEA47",
    what: "#38E87B",
    where: "#5297FF",
};

interface ColourfulSemanticsSettingsScreenProps {
    options: ColourfulSemanticsOptions;
    payload: ColourfulSemanticsPayload;
    onSetOptions: (options: ColourfulSemanticsOptions) => void;
}

export const ColourfulSemanticsSettingsScreen = ({
    options,
    payload,
    onSetOptions,
}: ColourfulSemanticsSettingsScreenProps) => {
    const scene = payload.scenes[0];
    const maxOptions = Math.min(
        5,
        getMaxOptionsForPreset(scene, options.presetId),
    );

    useEffect(() => {
        if (options.numberOfOptions <= maxOptions) {
            return;
        }

        onSetOptions({
            ...options,
            numberOfOptions: maxOptions,
        });
    }, [maxOptions, onSetOptions, options]);

    return (
        <div className={styles.container}>
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Complexity Level</h3>
                <div className={styles.presetList}>
                    {PRESET_OPTIONS.map((preset) => {
                        const isSelected = preset.id === options.presetId;
                        const slots = getSlotsForPreset(preset.id);

                        return (
                            <button
                                key={preset.id}
                                className={`${styles.presetButton} ${isSelected ? styles.presetButtonSelected : ""}`.trim()}
                                onClick={() =>
                                    onSetOptions({
                                        ...options,
                                        presetId: preset.id,
                                    })
                                }
                                type="button"
                            >
                                <span className={styles.presetLabel}>
                                    {preset.label}
                                </span>
                                <span className={styles.slotChipRow}>
                                    {slots.map((slot) => (
                                        <span
                                            key={slot}
                                            className={styles.slotChip}
                                            style={{
                                                backgroundColor:
                                                    SLOT_COLOURS[slot],
                                            }}
                                        />
                                    ))}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Number of options:</h3>
                <select
                    className={styles.optionsSelect}
                    value={Math.min(options.numberOfOptions, maxOptions)}
                    onChange={(event) =>
                        onSetOptions({
                            ...options,
                            numberOfOptions: Number(event.target.value),
                        })
                    }
                >
                    {Array.from(
                        { length: maxOptions },
                        (_, index) => index + 1,
                    ).map((optionCount) => (
                        <option key={optionCount} value={optionCount}>
                            {optionCount}
                        </option>
                    ))}
                </select>
            </section>
        </div>
    );
};

export default ColourfulSemanticsSettingsScreen;
