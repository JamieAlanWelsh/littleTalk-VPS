import { useCallback } from "react";
import { useAudio } from "./useAudio";
import { getTtsAudioUrl } from "../lib/getTtsAudioUrl";

const playAndWait = (audioUrl: string) =>
    new Promise<void>((resolve) => {
        const audio = new Audio(audioUrl);
        audio.addEventListener("ended", () => resolve());
        audio.addEventListener("error", () => resolve());
        audio.play().catch(() => resolve());
    });

// Speaks exercise text via pre-generated ElevenLabs audio, falling back silently if not yet generated.
export const useTts = () => {
    const { play } = useAudio();

    const speak = useCallback(
        (text: string | null | undefined, options?: { isMuted?: boolean }) => {
            if (!text || options?.isMuted) return;

            const audioUrl = getTtsAudioUrl(text);
            if (!audioUrl) return;

            play(audioUrl);
        },
        [play],
    );

    // Speaks a sequence of separately generated clips back-to-back, e.g. for sentences built at runtime.
    const speakSequence = useCallback(
        async (
            texts: Array<string | null | undefined>,
            options?: { isMuted?: boolean },
        ) => {
            if (options?.isMuted) return;

            const audioUrls = texts
                .map((text) => (text ? getTtsAudioUrl(text) : null))
                .filter((url): url is string => Boolean(url));

            for (const audioUrl of audioUrls) {
                await playAndWait(audioUrl);
            }
        },
        [],
    );

    return { speak, speakSequence };
};

export default useTts;
