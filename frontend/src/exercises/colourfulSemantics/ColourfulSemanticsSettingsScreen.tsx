import { useEffect } from "react";
import { getMaxOptionsAcrossScenes, getSlotsForPreset } from "./configureScene";
import styles from "./ColourfulSemanticsSettingsScreen.module.css";
import type {
    ColourfulSemanticsOptions,
    ColourfulSemanticsOptionalSlot,
    ColourfulSemanticsPayload,
    ColourfulSemanticsPresetId,
    ColourfulSemanticsSlot,
    ColourfulSemanticsVariantConfig,
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
    "to-who": "#FFFFFF",
    when: "#B88163",
    "what-like": "#C75EFF",
    how: "#FFBEE5",
};

const OPTIONAL_SLOT_LABELS: Record<ColourfulSemanticsOptionalSlot, string> = {
    "to-who": "To Who",
    when: "When",
    "what-like": "What like?",
    how: "How?",
};

interface ColourfulSemanticsSettingsScreenProps {
    options: ColourfulSemanticsOptions;
    payload: ColourfulSemanticsPayload;
    variant: ColourfulSemanticsVariantConfig;
    onSetOptions: (options: ColourfulSemanticsOptions) => void;
}

export const ColourfulSemanticsSettingsScreen = ({
    options,
    payload,
    variant,
    onSetOptions,
}: ColourfulSemanticsSettingsScreenProps) => {
    const availablePresets = PRESET_OPTIONS.filter((preset) =>
        variant.allowedPresetIds.includes(preset.id),
    );
    const showPresetSelection = variant.id !== "advanced";
    const showMuteVoiceToggle = variant.id !== "advanced";
    const maxOptions = Math.min(
        variant.maxNumberOfOptions,
        getMaxOptionsAcrossScenes(payload, payload.scenes, options, variant),
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
                {showPresetSelection ? (
                    <>
                        <h3 className={styles.sectionTitle}>
                            Complexity Level
                        </h3>
                        <div className={styles.presetList}>
                            {availablePresets.map((preset) => {
                                const isSelected =
                                    preset.id === options.presetId;
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
                    </>
                ) : (
                    <>
                        <h3 className={styles.sectionTitle}>
                            Base Sentence Blocks
                        </h3>
                        <p className={styles.sectionDescription}>
                            Advanced always includes the stage&apos;s authored
                            base blocks up to location when it exists.
                        </p>
                        <div className={styles.slotChipRow}>
                            {getSlotsForPreset(options.presetId).map((slot) => (
                                <span
                                    key={slot}
                                    className={styles.slotChip}
                                    style={{
                                        backgroundColor: SLOT_COLOURS[slot],
                                    }}
                                />
                            ))}
                        </div>
                    </>
                )}
            </section>

            {variant.availableOptionalSlotIds.length > 0 ? (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Extra Levels</h3>
                    <div className={styles.optionalSlotList}>
                        {variant.availableOptionalSlotIds.map((slotId) => {
                            const isSelected =
                                options.enabledOptionalSlotIds.includes(slotId);

                            return (
                                <button
                                    key={slotId}
                                    className={`${styles.optionalSlotButton} ${isSelected ? styles.optionalSlotButtonSelected : ""}`.trim()}
                                    onClick={() =>
                                        onSetOptions({
                                            ...options,
                                            enabledOptionalSlotIds: isSelected
                                                ? options.enabledOptionalSlotIds.filter(
                                                      (enabledSlotId) =>
                                                          enabledSlotId !==
                                                          slotId,
                                                  )
                                                : [
                                                      ...options.enabledOptionalSlotIds,
                                                      slotId,
                                                  ],
                                        })
                                    }
                                    type="button"
                                >
                                    <span
                                        className={styles.slotChip}
                                        style={{
                                            backgroundColor:
                                                SLOT_COLOURS[slotId],
                                        }}
                                    />
                                    <span className={styles.optionalSlotLabel}>
                                        {OPTIONAL_SLOT_LABELS[slotId]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            ) : null}

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

            {showMuteVoiceToggle ? (
                <section className={styles.section}>
                    <label className={styles.muteToggleRow}>
                        <input
                            type="checkbox"
                            checked={options.isVoiceMuted}
                            onChange={(event) =>
                                onSetOptions({
                                    ...options,
                                    isVoiceMuted: event.target.checked,
                                })
                            }
                        />
                        Mute Voice
                    </label>
                </section>
            ) : null}
        </div>
    );
};

export default ColourfulSemanticsSettingsScreen;
