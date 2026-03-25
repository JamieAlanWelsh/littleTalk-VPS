/**
 * TextPrompt Component
 *
 * Displays a text-based prompt, instruction, or feedback message.
 * Supports different semantic roles (prompt, instruction, feedback) for styling variants.
 */

import React from 'react';
import type { SentenceBlock as SentenceBlockType } from '../../lib/types';

interface TextPromptProps {
  block: SentenceBlockType;
  isCorrect?: boolean | null;
  className?: string;
}

export const TextPrompt: React.FC<TextPromptProps> = ({ block, isCorrect, className = '' }) => {
  const roleClass = block.role ? `${block.role}` : '';
  const feedbackClass = block.role === 'feedback' && isCorrect !== null
    ? isCorrect ? 'correct' : 'incorrect'
    : '';

  return (
    <div className={`sentence-block ${roleClass} ${feedbackClass} ${className}`.trim()}>
      {block.text}
    </div>
  );
};

export default TextPrompt;
