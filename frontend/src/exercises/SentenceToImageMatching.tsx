/**
 * Sentence-to-Picture Matching Exercise
 *
 * Example implementation of the exercise framework.
 * Users read a sentence and click the matching icon/picture.
 */

import React, { useState, useMemo } from 'react';
import type { MatchingExercisePayload, ExerciseState } from '../lib/types';
import ExerciseLayout from '../framework/layouts/ExerciseLayout';
import { TextPrompt, ImageOption } from '../framework/primitives';

interface SentenceToImageMatchingProps {
  payload: MatchingExercisePayload;
  onComplete?: (completedPairs: number) => void;
}

export const SentenceToImageMatching: React.FC<SentenceToImageMatchingProps> = ({
  payload,
  onComplete,
}) => {
  const [state, setState] = useState<ExerciseState>({
    currentPromptIndex: 0,
    selectedIconIds: [],
    isCorrect: null,
    showingFeedback: false,
    completedPairs: 0,
    totalPairs: payload.pairs.length,
  });

  // Get the current prompt and its correct answers
  const currentPrompt = useMemo(() => {
    return payload.prompts[state.currentPromptIndex];
  }, [payload.prompts, state.currentPromptIndex]);

  const currentPair = useMemo(() => {
    return payload.pairs.find(pair => pair.promptId === currentPrompt.id);
  }, [payload.pairs, currentPrompt]);

  // Check if an icon is the correct answer
  const isCorrectAnswer = (iconId: string): boolean => {
    return currentPair?.correctIconIds.includes(iconId) ?? false;
  };

  // Handle icon selection
  const handleSelectIcon = (iconId: string) => {
    if (state.showingFeedback) return; // Prevent changes after feedback
    setState(prev => ({
      ...prev,
      selectedIconIds: [iconId], // Single selection for simplicity
    }));
  };

  // Submit the answer
  const handleSubmitAnswer = () => {
    if (state.selectedIconIds.length === 0) return;

    const selectedIconId = state.selectedIconIds[0];
    const isAnswerCorrect = isCorrectAnswer(selectedIconId);

    setState(prev => ({
      ...prev,
      isCorrect: isAnswerCorrect,
      showingFeedback: true,
    }));
  };

  // Move to next prompt
  const handleNext = () => {
    if (state.currentPromptIndex < payload.pairs.length - 1) {
      setState(prev => ({
        ...prev,
        currentPromptIndex: prev.currentPromptIndex + 1,
        selectedIconIds: [],
        isCorrect: null,
        showingFeedback: false,
        completedPairs: state.isCorrect ? prev.completedPairs + 1 : prev.completedPairs,
      }));
    } else {
      // Exercise complete
      const finalCompleted = state.isCorrect ? state.completedPairs + 1 : state.completedPairs;
      onComplete?.(finalCompleted);
    }
  };

  // Retry current prompt
  const handleRetry = () => {
    setState(prev => ({
      ...prev,
      selectedIconIds: [],
      isCorrect: null,
      showingFeedback: false,
    }));
  };

  const progressLabel = `${state.completedPairs}/${state.totalPairs} correct`;
  let feedbackMessage = '';
  let feedbackType: 'correct' | 'incorrect' | undefined = undefined;

  if (state.showingFeedback) {
    if (state.isCorrect) {
      feedbackMessage = 'Great! That\'s correct!';
      feedbackType = 'correct';
    } else {
      feedbackMessage = 'Not quite. Try again!';
      feedbackType = 'incorrect';
    }
  }

  return (
    <ExerciseLayout
      title={payload.title}
      instructions={payload.instructions}
      progressLabel={progressLabel}
      feedbackMessage={feedbackMessage}
      feedbackType={feedbackType}
      showSubmitButton={!state.showingFeedback}
      showRetryButton={state.showingFeedback && !state.isCorrect}
      showNextButton={state.showingFeedback}
      submitButtonDisabled={state.selectedIconIds.length === 0}
      submitButtonLabel="Check Answer"
      onSubmit={handleSubmitAnswer}
      onRetry={handleRetry}
      onNext={handleNext}
    >
      {/* Prompt Section */}
      <div className="exercise-prompt-area">
        <TextPrompt block={currentPrompt} isCorrect={state.isCorrect} />
      </div>

      {/* Answer Options */}
      <div className="exercise-answer-grid">
        {payload.icons.map(icon => (
          <ImageOption
            key={icon.id}
            block={icon}
            isSelected={state.selectedIconIds.includes(icon.id)}
            isCorrect={
              state.showingFeedback && state.selectedIconIds.includes(icon.id)
                ? isCorrectAnswer(icon.id)
                : state.showingFeedback && isCorrectAnswer(icon.id)
                ? true
                : null
            }
            isDisabled={state.showingFeedback && !state.selectedIconIds.includes(icon.id)}
            onClick={handleSelectIcon}
          />
        ))}
      </div>
    </ExerciseLayout>
  );
};

export default SentenceToImageMatching;
