import React, { createContext, useContext, useState } from "react";

import type { ExerciseGroupLearner } from "../lib/bootstrap";

interface GroupContextType {
    groupId: number | null;
    groupLearners: ExerciseGroupLearner[];
    turnOrder: ExerciseGroupLearner[];
    isGroupMode: boolean;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

interface GroupContextProviderProps {
    children: React.ReactNode;
    groupId: number | null;
    groupLearners: ExerciseGroupLearner[];
}

const shuffleLearners = (learners: ExerciseGroupLearner[]) => {
    const shuffled = [...learners];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [
            shuffled[swapIndex],
            shuffled[index],
        ];
    }

    return shuffled;
};

export function GroupContextProvider({
    children,
    groupId,
    groupLearners,
}: GroupContextProviderProps) {
    const [turnOrder] = useState(() => shuffleLearners(groupLearners));

    return (
        <GroupContext.Provider
            value={{
                groupId,
                groupLearners,
                turnOrder,
                isGroupMode: groupId !== null && groupLearners.length > 0,
            }}
        >
            {children}
        </GroupContext.Provider>
    );
}

export function useGroupContextValue() {
    const context = useContext(GroupContext);

    if (context === undefined) {
        throw new Error(
            "useGroupContextValue must be used within GroupContextProvider",
        );
    }

    return context;
}
