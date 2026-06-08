import { useMemo, useState } from "react";

import { updateLearnerAvatar } from "../../api/updateLearnerAvatar";
import { readCsrfTokenFromCookie } from "../../utils/cookies";
import styles from "./AvatarEditor.module.css";

export interface AvatarCharacter {
    id: string;
    name: string;
    bio: string;
    imageUrl: string;
}

interface AvatarEditorProps {
    learnerName: string;
    characters: AvatarCharacter[];
    colors: string[];
    initialCharacterId: string;
    initialColor: string;
    saveUrl: string;
    backUrl: string;
}

const clampCharacterIndex = (
    characters: AvatarCharacter[],
    characterId: string,
) => {
    const foundIndex = characters.findIndex(
        (character) => character.id === characterId,
    );
    return foundIndex >= 0 ? foundIndex : 0;
};

const AvatarEditor = ({
    learnerName,
    characters,
    colors,
    initialCharacterId,
    initialColor,
    saveUrl,
    backUrl,
}: AvatarEditorProps) => {
    const [slideDirection, setSlideDirection] = useState<"next" | "previous">(
        "next",
    );
    const [animationTick, setAnimationTick] = useState(0);
    const [activeIndex, setActiveIndex] = useState(() =>
        clampCharacterIndex(characters, initialCharacterId),
    );
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeCharacter = useMemo(() => {
        if (characters.length === 0) {
            return null;
        }
        return characters[activeIndex];
    }, [activeIndex, characters]);

    const handlePrevious = () => {
        if (characters.length === 0) {
            return;
        }
        setSlideDirection("previous");
        setAnimationTick((value) => value + 1);
        setActiveIndex(
            (previous) =>
                (previous - 1 + characters.length) % characters.length,
        );
    };

    const handleNext = () => {
        if (characters.length === 0) {
            return;
        }
        setSlideDirection("next");
        setAnimationTick((value) => value + 1);
        setActiveIndex((previous) => (previous + 1) % characters.length);
    };

    const handleConfirm = async () => {
        if (!activeCharacter || isSaving) {
            return;
        }

        const csrfToken = readCsrfTokenFromCookie();
        if (!csrfToken) {
            setError("Missing CSRF token. Please refresh and try again.");
            return;
        }

        setError(null);
        setIsSaving(true);

        try {
            await updateLearnerAvatar(
                saveUrl,
                {
                    avatar_character: activeCharacter.id,
                    avatar_color: selectedColor,
                },
                csrfToken,
            );
            window.location.assign(backUrl);
        } catch (saveError) {
            const message =
                saveError instanceof Error
                    ? saveError.message
                    : "Unable to save avatar.";
            setError(message);
            setIsSaving(false);
        }
    };

    if (!activeCharacter) {
        return (
            <main className={styles.page}>
                <section className={styles.card}>
                    <p className={styles.error}>
                        No avatar characters are configured.
                    </p>
                    <div className={styles.footerRow}>
                        <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => window.location.assign(backUrl)}
                        >
                            CANCEL
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <div className={styles.headerRow}>
                    <h1 className={styles.title}>
                        {learnerName}&apos;s Avatar
                    </h1>
                </div>

                <p className={styles.subtitle}>Choose your Avatar</p>

                <div className={styles.sectionDivider} aria-hidden="true" />

                <div className={styles.carouselRow}>
                    <button
                        type="button"
                        className={styles.arrowButton}
                        onClick={handlePrevious}
                        aria-label="Previous avatar"
                    >
                        <span aria-hidden="true">&lt;</span>
                    </button>

                    <div
                        className={styles.avatarPreview}
                        style={{ backgroundColor: selectedColor }}
                    >
                        <div
                            key={`${activeCharacter.id}-${animationTick}`}
                            className={`${styles.avatarImageMotion} ${
                                slideDirection === "next"
                                    ? styles.slideFromRight
                                    : styles.slideFromLeft
                            }`}
                        >
                            <img
                                src={activeCharacter.imageUrl}
                                alt={activeCharacter.name}
                                className={styles.avatarImage}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className={styles.arrowButton}
                        onClick={handleNext}
                        aria-label="Next avatar"
                    >
                        <span aria-hidden="true">&gt;</span>
                    </button>
                </div>

                <h2 className={styles.characterName}>{activeCharacter.name}</h2>
                <p className={styles.bio}>{activeCharacter.bio}</p>

                <div className={styles.sectionDivider} aria-hidden="true" />

                <div className={styles.colorGrid}>
                    {colors.map((color) => {
                        const isSelected = color === selectedColor;
                        return (
                            <button
                                key={color}
                                type="button"
                                className={`${styles.colorSwatch} ${isSelected ? styles.colorSwatchSelected : ""}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                                aria-label={`Select color ${color}`}
                                aria-pressed={isSelected}
                            />
                        );
                    })}
                </div>

                {error ? <p className={styles.error}>{error}</p> : null}

                <div className={styles.sectionDivider} aria-hidden="true" />

                <div className={styles.footerColumn}>
                    <button
                        type="button"
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={isSaving}
                    >
                        {isSaving ? "SAVING..." : "CONFIRM"}
                    </button>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => window.location.assign(backUrl)}
                        disabled={isSaving}
                    >
                        CANCEL
                    </button>
                </div>
            </section>
        </main>
    );
};

export default AvatarEditor;
