/**
 * Exercise Framework Type Definitions
 *
 * Defines the core data structures and contracts for all exercise exercises.
 * These types are intentionally minimal and UI-focused to support composition
 * of new exercises using reusable blocks.
 */

import { z } from "zod";

/**
 * SentenceBlock: A text-based prompt or label for the user.
 * Used to display instructions, prompts, feedback text, etc.
 */
export interface SentenceBlock {
    id: string;
    text: string;
    role?: "prompt" | "instruction" | "feedback" | "result"; // semantic hint for styling
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
    sfxUrl?: string; // Optional sound effect path for icon interactions
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
 * These objects are common between the Django backend and React frontend, so need to
 * define them in a shared types file to ensure consistency and type safety across the stack.
 * Here is fine for now though
 */

export const QuestionSchema = z.object({
    id: z.string(),
    prompt: z.string(),
    correctIconIds: z.array(z.string()),
});

export type Question = z.infer<typeof QuestionSchema>;

export const PictureSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    label: z.string(),
    altText: z.string().optional(),
    sfxUrl: z.string().optional(),
});

export type Picture = z.infer<typeof PictureSchema>;

export const MatchingExercisePayload2Schema = z.object({
    questions: z.array(QuestionSchema),
    pictures: z.array(PictureSchema),
});

export type MatchingExercisePayload2 = z.infer<
    typeof MatchingExercisePayload2Schema
>;

export const ThinkAndFindItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  label: z.string(),
  prompt: z.string(),
  altText: z.string().optional(),
});

export type ThinkAndFindItem = z.infer<typeof ThinkAndFindItemSchema>;

export const ThinkAndFindSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(ThinkAndFindItemSchema).min(1),
});

export type ThinkAndFindSet = z.infer<typeof ThinkAndFindSetSchema>;

export const ThinkAndFindPayloadSchema = z.object({
  rounds: z.number().int().positive(),
  imageSets: z.array(ThinkAndFindSetSchema).min(4),
});

export type ThinkAndFindPayload = z.infer<typeof ThinkAndFindPayloadSchema>;

export const ConceptQuestConceptSchema = z.enum([
  "big",
  "small",
  "short",
  "long",
  "tall",
]);

export type ConceptQuestConcept = z.infer<typeof ConceptQuestConceptSchema>;

export const ConceptQuestComplexitySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export type ConceptQuestComplexity = z.infer<
  typeof ConceptQuestComplexitySchema
>;

export const ConceptQuestItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  label: z.string(),
  altText: z.string().optional(),
});

export type ConceptQuestItem = z.infer<typeof ConceptQuestItemSchema>;

export const ConceptQuestSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  supportedConcepts: z.array(ConceptQuestConceptSchema).min(1),
  items: z.array(ConceptQuestItemSchema).min(4),
});

export type ConceptQuestSet = z.infer<typeof ConceptQuestSetSchema>;

export const ConceptQuestPayloadSchema = z.object({
  rounds: z.number().int().positive(),
  imageSets: z.array(ConceptQuestSetSchema).min(4),
});

export type ConceptQuestPayload = z.infer<typeof ConceptQuestPayloadSchema>;

export interface ConceptQuestOptions {
  concepts: ConceptQuestConcept[];
  complexity: ConceptQuestComplexity;
}

// state types
export interface ExerciseState2 {
    currentQuestionIndex: number;
}

export interface QuestionState {
    selectedIconIds: string[];
    answerState: AnswerState;
}

export type AnswerState = "notAnswered" | "correct" | "incorrect";

/**
 * SentenceMatchingOptions: Configuration options for the Sentence Matching exercise.
 */
export interface SentenceMatchingOptions {
    numberOfOptions: number;
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
