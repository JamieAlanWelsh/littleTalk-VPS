/**
 * useConfetti Hook
 *
 * React hook that triggers a confetti animation with particles falling from
 * the top-left and top-right corners for 15 seconds.
 * Uses canvas-confetti library.
 *
 * Usage:
 * const { triggerConfetti } = useConfetti();
 * triggerConfetti(); // Call whenever you want confetti
 */

import { useCallback } from "react";
import confetti from "canvas-confetti";

export const useConfetti = () => {
  const triggerConfetti = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      //   const particleCount = 50 * (timeLeft / duration);

      // Left side confetti
      confetti({
        ...defaults,
        // particleCount,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
      });
    }, 750);
  }, []);

  return { triggerConfetti };
};

export default useConfetti;
