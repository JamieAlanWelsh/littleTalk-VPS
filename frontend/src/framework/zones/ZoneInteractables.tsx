/**
 * ZoneInteractables Component (Zone 3)
 *
 * Container for interactive answer options (icons, buttons, etc).
 * Reusable across different exercise types.
 */

import React, { type ReactNode } from 'react';

interface ZoneInteractablesProps {
  children: ReactNode;
}

export const ZoneInteractables: React.FC<ZoneInteractablesProps> = ({ children }) => {
  return (
    <div className="exercise-zone exercise-zone-interactables">
      {children}
    </div>
  );
};

export default ZoneInteractables;
