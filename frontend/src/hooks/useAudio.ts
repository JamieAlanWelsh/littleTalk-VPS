import { useCallback, useRef } from "react";

export const useAudio = () => {
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    const play = useCallback((src: string) => {
        // Stop any currently playing audio
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
        }

        const audio = new Audio(src);
        currentAudioRef.current = audio;
        audio.play().catch(() => {
            // Autoplay may be blocked before user interaction — fail silently
        });
    }, []);

    return { play };
};

export default useAudio;
