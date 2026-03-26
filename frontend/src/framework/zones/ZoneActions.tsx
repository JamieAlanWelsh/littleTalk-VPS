/**
 * ZoneActions Component (Zone 4)
 *
 * Container for action buttons (Check Answer, Continue, etc).
 * Reusable across all exercise types.
 */

import React from 'react';
import { ExerciseActionButton } from '../primitives';

export interface ZoneAction {
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
}

type ZoneActionsTone = 'neutral' | 'correct' | 'incorrect';

interface ZoneActionsProps {
  primaryAction: ZoneAction;
  onSkip: () => void;
  feedbackMessage?: string;
  tone?: ZoneActionsTone;
}

export const ZoneActions: React.FC<ZoneActionsProps> = ({
  primaryAction,
  onSkip,
  feedbackMessage,
  tone = 'neutral',
}) => {
  const toneClass = tone === 'neutral' ? '' : `exercise-zone-actions--${tone}`;

  return (
    <div className={`exercise-zone-actions ${toneClass}`.trim()}>
      <div className="exercise-zone-actions-content">
        <div className="exercise-zone-actions-left">
          {feedbackMessage ? (
            <p className="exercise-zone-actions-message">{feedbackMessage}</p>
          ) : (
            <ExerciseActionButton label="Skip" variant="secondary" onClick={onSkip} />
          )}
        </div>

        <div className="exercise-zone-actions-right">
          <ExerciseActionButton {...primaryAction} />
        </div>
      </div>
    </div>
  );
};

export default ZoneActions;
