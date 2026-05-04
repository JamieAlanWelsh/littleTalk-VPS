import { getIsPluralSubject, resolveOptionPresentation } from "./presentation";
import type {
    ColourfulSemanticsOption,
    ColourfulSemanticsSlot,
    ConfiguredColourfulSemanticsScene,
} from "./types";
import type { Question } from "../../lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SceneQuestion {
    id: string;
    slot: ColourfulSemanticsSlot;
    prompt: string;
    /** Resolved option objects, shuffled and trimmed to numberOfOptions. */
    options: ColourfulSemanticsOption[];
    /** correctOptionId */
    answer: string;
}

/** Affirmation pseudo-question appended after all steps in a scene. */
export interface AffirmationQuestion {
    id: string;
    slot: "affirmation";
    prompt: string;
    options: [];
    answer: null;
}

export type FlatSceneQuestion = SceneQuestion | AffirmationQuestion;

export interface SceneQuestions {
    sceneId: string;
    sceneImageUrl: string;
    scene: ConfiguredColourfulSemanticsScene;
    /** Step questions + one trailing affirmation question. */
    questions: FlatSceneQuestion[];
}

export type QuestionLocation =
    | { type: "step"; sceneQuestions: SceneQuestions; stepIndex: number }
    | { type: "affirmation"; sceneQuestions: SceneQuestions };

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

const buildAffirmationPrompt = (
    scene: ConfiguredColourfulSemanticsScene,
    itemsById: Record<string, ColourfulSemanticsOption>,
): string => {
    // We don't know the player's selections yet — this prompt is based on the
    // *correct* answers, which is exactly what the affirmation celebrates.
    const correctSelectionIds = scene.steps.map((step) => step.correctOptionId);

    const isPluralSubject = getIsPluralSubject({
        itemsById,
        scene,
        selectionIds: correctSelectionIds,
    });

    const sentence = scene.steps
        .map((step) => {
            const item = itemsById[step.correctOptionId];
            if (!item) return "";
            return resolveOptionPresentation({
                item,
                slot: step.slot,
                isPluralSubject,
            }).label;
        })
        .filter(Boolean)
        .join(" ")
        .trim();

    const sentenceWithPunctuation = /[.!?]$/.test(sentence)
        ? sentence
        : `${sentence}.`;

    return sentence
        ? `That's right! ${sentenceWithPunctuation}`
        : "That's right!";
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a configured scene into a SceneQuestions object.
 * Resolves option ids → option objects and appends an affirmation question.
 */
export const buildSceneQuestions = (
    scene: ConfiguredColourfulSemanticsScene,
    itemsById: Record<string, ColourfulSemanticsOption>,
): SceneQuestions => {
    const stepQuestions: SceneQuestion[] = scene.steps.map((step) => ({
        id: step.id,
        slot: step.slot,
        prompt: step.prompt,
        options: step.optionIds
            .map((id) => itemsById[id])
            .filter((o): o is ColourfulSemanticsOption => !!o),
        answer: step.correctOptionId,
    }));

    const affirmation: AffirmationQuestion = {
        id: `${scene.id}-affirmation`,
        slot: "affirmation",
        prompt: buildAffirmationPrompt(scene, itemsById),
        options: [],
        answer: null,
    };

    return {
        sceneId: scene.id,
        sceneImageUrl: scene.targetImageUrl,
        scene,
        questions: [...stepQuestions, affirmation],
    };
};

/**
 * Build the flat Question[] that ExerciseLayout expects from a list of SceneQuestions.
 * Affirmation questions get an empty correctIconIds array — the Game pre-sets their
 * answerState to "correct" so ExerciseLayout immediately shows Continue.
 */
export const buildFlatQuestions = (
    sceneQuestionsList: SceneQuestions[],
): Question[] =>
    sceneQuestionsList.flatMap((sq) =>
        sq.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            correctIconIds: q.slot !== "affirmation" ? [q.answer] : [],
        })),
    );

/**
 * Resolve a flat question index back to its scene + step context.
 */
export const resolveQuestionLocation = (
    sceneQuestionsList: SceneQuestions[],
    flatIndex: number,
): QuestionLocation => {
    let remaining = flatIndex;

    for (const sceneQuestions of sceneQuestionsList) {
        const count = sceneQuestions.questions.length;
        if (remaining < count) {
            const question = sceneQuestions.questions[remaining];
            if (question.slot === "affirmation") {
                return { type: "affirmation", sceneQuestions };
            }
            return {
                type: "step",
                sceneQuestions,
                stepIndex: remaining,
            };
        }
        remaining -= count;
    }

    // Fallback — should never happen if flatIndex is within bounds
    const last = sceneQuestionsList[sceneQuestionsList.length - 1];
    return { type: "affirmation", sceneQuestions: last };
};
