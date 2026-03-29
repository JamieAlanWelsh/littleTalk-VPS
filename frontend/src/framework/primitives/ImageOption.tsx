/**
 * ImageOption Component
 *
 * Displays an icon card.
 * Supports interactive states: default, selected, correct, incorrect, disabled.
 */

import type { Picture } from '../../lib/types';

interface ImageOptionProps {
  image: Picture;
  isCorrect: boolean | null;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export const ImageOption = ({
  image,
  isCorrect,
  isSelected,
  isDisabled = false,
  onClick,
}: ImageOptionProps) => {

  // Determine state classes
  let stateClass = '';
  if (isDisabled) {
    stateClass = 'disabled';
  } else if (isCorrect === true) {
    stateClass = 'correct';
  } else if (isCorrect === false) {
    stateClass = 'incorrect';
  } else if (isSelected) {
    stateClass = 'selected';
  } else {
    stateClass = 'interactive';
  }

  return (
    <button
      className={`icon-block ${stateClass}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={image.label || image.altText || `Option ${image.id}`}
      type="button"
    >
      <img
        src={image.imageUrl}
        alt={image.altText || image.label || 'Icon option'}
        className="icon-block-image"
      />
    </button>
  );
};

export default ImageOption;
