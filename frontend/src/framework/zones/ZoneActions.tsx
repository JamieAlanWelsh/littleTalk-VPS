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

interface ZoneActionsProps {
  actions: ZoneAction[];
}

export const ZoneActions: React.FC<ZoneActionsProps> = ({ actions }) => {
  return (
    <div className="exercise-zone-actions">
      {actions.map((action, index) => (
        <ExerciseActionButton key={index} {...action} />
      ))}
    </div>
  );
};

export default ZoneActions;
