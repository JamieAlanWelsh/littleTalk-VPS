import { useState, useEffect } from "react";

/**
 * Custom hook for tracking exercise progress across all exercise types.
 * Manages all data required for the submitExercise payload:
 * - startedAt
 * - attemptsPerQuestion
 * - incorrectAnswers
 * - totalSkips
 */
export function useExerciseTracking(totalQuestions: number) {
  const [startedAt, setStartedAt] = useState<string>("");
  const [attemptsPerQuestion, setAttemptsPerQuestion] = useState<number[]>(
    Array(totalQuestions).fill(0),
  );
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [totalSkips, setTotalSkips] = useState(0);

  // Capture exercise start time on mount
  useEffect(() => {
    setStartedAt(new Date().toISOString());
  }, []);

  /**
   * Increment the attempt count for a specific question.
   * Call this each time the user clicks "Check Answer".
   */
  const incrementAttempt = (questionIndex: number) => {
    setAttemptsPerQuestion((prev) => {
      const updated = [...prev];
      updated[questionIndex]++;
      return updated;
    });
  };

  /**
   * Increment incorrect answers counter.
   * Call this when user answers a question incorrectly.
   */
  const incrementIncorrectAnswers = () => {
    setIncorrectAnswers((prev) => prev + 1);
  };

  /**
   * Increment the total skips counter.
   * Call this if you implement a "Skip" feature.
   */
  const incrementSkips = () => {
    setTotalSkips((prev) => prev + 1);
  };

  return {
    startedAt,
    attemptsPerQuestion,
    incorrectAnswers,
    totalSkips,
    incrementAttempt,
    incrementIncorrectAnswers,
    incrementSkips,
  };
}
