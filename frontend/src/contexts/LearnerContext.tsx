/**
 * LearnerContext - Provides learnerUUID to child components
 */

import React, { createContext, useContext } from "react";

interface LearnerContextType {
  learnerUUID: string | null;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

interface LearnerContextProviderProps {
  children: React.ReactNode;
  learnerUUID: string | null;
}

export function LearnerContextProvider({
  children,
  learnerUUID,
}: LearnerContextProviderProps) {
  return (
    <LearnerContext.Provider value={{ learnerUUID }}>
      {children}
    </LearnerContext.Provider>
  );
}

export function useLearnerContextValue() {
  const context = useContext(LearnerContext);
  if (context === undefined) {
    throw new Error(
      "useLearnerContextValue must be used within LearnerContextProvider",
    );
  }
  return context;
}
