/**
 * ZonePrompt Component (Zone 2)
 *
 * Displays the exercise prompt area with a heading and instruction text.
 * Reusable across all exercise types.
 */

import React from 'react';
import { TextPrompt } from '../primitives';

interface ZonePromptProps {
  title: string;
  instruction: string;
}

export const ZonePrompt: React.FC<ZonePromptProps> = ({ title, instruction }) => {
  return (
    <div className="exercise-zone exercise-zone-prompt">
      <TextPrompt
        block={{ id: 'zone-prompt-title', text: title, role: 'prompt' }}
        className="zone-prompt-title"
      />
      <TextPrompt
        block={{ id: 'zone-prompt-instruction', text: instruction, role: 'instruction' }}
        className="zone-prompt-instruction"
      />
    </div>
  );
};

export default ZonePrompt;
