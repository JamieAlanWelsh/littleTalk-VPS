/**
 * ZoneInteractables Component (Zone 3)
 * Container for interactive answer options (icons, buttons, etc).
 */

import React, { type ReactNode } from 'react';

export const ZoneInteractables: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="exercise-zone exercise-zone-interactables">{children}</div>
);

export default ZoneInteractables;
