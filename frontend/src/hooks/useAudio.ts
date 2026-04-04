import { useCallback } from 'react';

export const useAudio = () => {
  const play = useCallback((src: string) => {
    const audio = new Audio(src);
    audio.play().catch(() => {
      // Autoplay may be blocked before user interaction — fail silently
    });
  }, []);

  return { play };
};

export default useAudio;
