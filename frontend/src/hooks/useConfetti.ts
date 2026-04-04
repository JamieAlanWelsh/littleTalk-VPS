import { useCallback } from "react";
import confetti from "canvas-confetti";

export const useConfetti = () => {
  const triggerConfetti = useCallback(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // Two gentle bursts on mount
    confetti({
      particleCount: 60,
      spread: 80,
      startVelocity: 45,
      origin: { x: 0.3, y: 0.65 },
      colors: ['#FFE477', '#33DA73', '#4A90E2', '#FF6B6B', '#C77DFF'],
      zIndex: 999,
    });
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 80,
        startVelocity: 45,
        origin: { x: 0.7, y: 0.65 },
        colors: ['#FFE477', '#33DA73', '#4A90E2', '#FF6B6B', '#C77DFF'],
        zIndex: 999,
      });
    }, 300);
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 90,
        startVelocity: 40,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#FFE477', '#33DA73', '#4A90E2', '#FF6B6B', '#C77DFF'],
        zIndex: 999,
      });
    }, 700);

    // Gentle ongoing shower from both sides
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = Math.floor(30 * (timeLeft / duration));

      confetti({
        particleCount,
        angle: randomInRange(60, 75),
        spread: 55,
        startVelocity: randomInRange(30, 42),
        origin: { x: 0, y: 0.7 },
        colors: ['#FFE477', '#33DA73', '#4A90E2', '#FF6B6B', '#C77DFF'],
        zIndex: 999,
      });

      confetti({
        particleCount,
        angle: randomInRange(105, 120),
        spread: 55,
        startVelocity: randomInRange(30, 42),
        origin: { x: 1, y: 0.7 },
        colors: ['#FFE477', '#33DA73', '#4A90E2', '#FF6B6B', '#C77DFF'],
        zIndex: 999,
      });
    }, 600);
  }, []);

  return { triggerConfetti };
};

export default useConfetti;
