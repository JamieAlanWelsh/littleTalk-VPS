/**
 * Sentence-to-Picture Matching Exercise
 *
 * Example implementation of the exercise framework.
 * Users read a sentence and click the matching icon/picture.
 */

import React, { useState } from 'react';
import type { MatchingExercisePayload, ExerciseState } from '../lib/types';
import ExerciseLayout from '../framework/layouts/ExerciseLayout';
import { ImageOption } from '../framework/primitives';
import { ZonePrompt, ZoneInteractables, ZoneActions, type ZoneAction } from '../framework/zones';

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

  const currentPrompt = payload.prompts[state.currentPromptIndex];
  const currentPair = payload.pairs.find(pair => pair.promptId === currentPrompt.id);

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

  const feedbackMessage = !state.showingFeedback ? ''
    : state.isCorrect ? "Great! That's correct!"
    : "Not quite. Try again!";

  const primaryAction: ZoneAction = !state.showingFeedback
    ? {
        label: 'Check',
        variant: 'primary',
        onClick: handleSubmitAnswer,
        disabled: state.selectedIconIds.length === 0,
      }
    : state.isCorrect
    ? {
        label: 'Continue',
        variant: 'primary',
        onClick: handleNext,
      }
    : {
        label: 'Try Again',
        variant: 'secondary',
        onClick: handleRetry,
      };

  const footerTone = !state.showingFeedback
    ? 'neutral'
    : state.isCorrect
    ? 'correct'
    : 'incorrect';

  return (
    <ExerciseLayout
      prompt={
        <ZonePrompt
          title={payload.title}
          instruction={currentPrompt.text}
        />
      }
    >
      <ZoneInteractables>
        {payload.icons.map(icon => (
          <ImageOption
            key={icon.id}
            block={icon}
            isSelected={state.selectedIconIds.includes(icon.id)}
            isCorrect={
              !state.showingFeedback ? null
                : isCorrectAnswer(icon.id) ? true
                : state.selectedIconIds.includes(icon.id) ? false
                : null
            }
            isDisabled={state.showingFeedback && !state.selectedIconIds.includes(icon.id)}
            onClick={handleSelectIcon}
          />
        ))}
      </ZoneInteractables>

      <ZoneActions
        onSkip={handleNext}
        primaryAction={primaryAction}
        feedbackMessage={state.showingFeedback ? feedbackMessage : undefined}
        tone={footerTone}
      />
    </ExerciseLayout>
  );
};

export default SentenceToImageMatching;
