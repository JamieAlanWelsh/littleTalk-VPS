/**
 * ImageOption Component
 *
 * Displays a picture/icon card with optional label.
 * Supports interactive states: default, selected, correct, incorrect, disabled.
 */

import React from 'react';
import type { IconBlock as IconBlockType } from '../../lib/types';

interface ImageOptionProps {
  block: IconBlockType;
  isSelected: boolean;
  isCorrect?: boolean | null;
  isDisabled?: boolean;
  onClick: (iconId: string) => void;
}

export const ImageOption: React.FC<ImageOptionProps> = ({
  block,
  isSelected,
  isCorrect,
  isDisabled = false,
  onClick,
}) => {
  const handleClick = () => {
    if (!isDisabled && isCorrect !== false) {
      onClick(block.id);
    }
  };

  // Determine state classes
  let stateClass = '';
  if (isDisabled) {
    stateClass = 'disabled';
  } else if (isCorrect !== null) {
    stateClass = isCorrect ? 'correct' : 'incorrect';
  } else if (isSelected) {
    stateClass = 'selected';
  } else {
    stateClass = 'interactive';
  }

  return (
    <button
      className={`icon-block ${stateClass}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={block.label || block.altText || `Option ${block.id}`}
      type="button"
    >
      <img
        src={block.imageUrl}
        alt={block.altText || block.label || 'Icon option'}
        className="icon-block-image"
      />
      {block.label && (
        <span className="icon-block-label">{block.label}</span>
      )}
    </button>
  );
};

export default ImageOption;
