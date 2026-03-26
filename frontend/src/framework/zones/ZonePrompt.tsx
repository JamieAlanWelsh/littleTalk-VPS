/**
 * ZonePrompt Component (Zone 2)
 *
 * Displays the exercise prompt area with a heading and instruction text.
 * Reusable across all exercise types.
 */

import React from 'react';

interface ZonePromptProps {
  title: string;
  instruction: string;
}

export const ZonePrompt: React.FC<ZonePromptProps> = ({ title, instruction }) => (
  <div className="exercise-zone exercise-zone-prompt">
    <div className="zone-prompt-title">{title}</div>
    <div className="zone-prompt-instruction">{instruction}</div>
  </div>
);

export default ZonePrompt;
