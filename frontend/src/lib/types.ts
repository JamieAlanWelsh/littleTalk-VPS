/**
 * Exercise Framework Type Definitions
 *
 * Defines the core data structures and contracts for all exercise exercises.
 * These types are intentionally minimal and UI-focused to support composition
 * of new exercises using reusable blocks.
 */

/**
 * SentenceBlock: A text-based prompt or label for the user.
 * Used to display instructions, prompts, feedback text, etc.
 */
export interface SentenceBlock {
  id: string;
  text: string;
  role?: 'prompt' | 'instruction' | 'feedback' | 'result'; // semantic hint for styling
}

/**
 * IconBlock: A visual answer option or display element.
 * Can represent a picture/icon paired with a label.
 */
export interface IconBlock {
  id: string;
  imageUrl: string; // Path relative to static assets or full URL
  label?: string; // Optional display label below the icon
  altText?: string; // Accessibility text
}

/**
 * MatchingPair: Associates a prompt (sentence) with one or more correct answer icons.
 * Used by matching-style exercises to define valid correct answers.
 */
export interface MatchingPair {
  promptId: string;
  correctIconIds: string[]; // Array to support multiple correct answers if needed
}

/**
 * MatchingExercisePayload: Complete data for a sentence-to-picture matching exercise.
 * Passed from Django to React via template data attributes.
 */
export interface MatchingExercisePayload {
  exerciseId: string;
  title: string;
  instructions: string;
  prompts: SentenceBlock[]; // List of sentences/prompts
  icons: IconBlock[]; // List of candidate pictures/icons
  pairs: MatchingPair[]; // Mappings of prompts to correct icons
  showFeedback?: boolean; // Default: true
  allowRetry?: boolean; // Default: true
}

/**
 * ExerciseState: Tracks the interactive state of an exercise.
 * Used by exercise shells and components to manage UI state.
 */
export interface ExerciseState {
  currentPromptIndex: number;
  selectedIconIds: string[]; // Icons selected by the user
  isCorrect: boolean | null; // null = neutral/unanswered, true = correct, false = incorrect
  showingFeedback: boolean;
  completedPairs: number; // Count of correct pairs matched so far
  totalPairs: number;
}

/**
 * ExerciseContextProps: Passed to exercise container/shell components.
 * Provides the exercise definition, current state, and handlers.
 */
export interface ExerciseContextProps {
  payload: MatchingExercisePayload;
  state: ExerciseState;
  onSelectIcon: (iconId: string) => void;
  onSubmitAnswer: () => void;
  onRetry: () => void;
  onNext: () => void;
  onComplete: () => void;
}
