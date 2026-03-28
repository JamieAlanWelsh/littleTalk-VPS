import type { ReactNode } from 'react';
import type { AnswerState } from '../../lib/types';
import { ExerciseActionButton } from '../primitives';
import styles from './exerciseActionBar.module.css';

interface ExerciseActionBar {
    actionBarPhase: AnswerState;
    feedbackMessage: string;
    onCheckAnswer: () => void;
    onTryAgain: () => void;
    onContinue: () => void;
}

export default ({
    actionBarPhase,
    feedbackMessage,
    onCheckAnswer,
    onTryAgain,
    onContinue,
}: ExerciseActionBar) => {
    let toneClass = '';
    let leftContent: ReactNode = null;
    let rightContent: ReactNode = null;

    switch (actionBarPhase) {
        case 'notAnswered':
            rightContent = (
                <ExerciseActionButton label="Check Answer" onClick={onCheckAnswer} />
            );
            break;
        case 'correct':
            toneClass = styles.exerciseZoneActionsCorrect;
            leftContent = (
                <p className={styles.exerciseZoneActionsMessage}>{feedbackMessage}</p>
            );
            rightContent = (
                <ExerciseActionButton label="Continue" onClick={onContinue} />
            );
            break;
        case 'incorrect':
            toneClass = styles.exerciseZoneActionsIncorrect;
            leftContent = (
                <>
                    <p className={styles.exerciseZoneActionsMessage}>{feedbackMessage}</p>
                    <ExerciseActionButton label="Try Again" onClick={onTryAgain} variant="secondary" />
                </>
            );
            break;
        default: {
            const exhaustiveCheck: never = actionBarPhase;
            throw new Error(`Unhandled action bar phase: ${exhaustiveCheck}`);
        }
    }

    return (
        <div className={`${styles.exerciseZoneActions} ${toneClass}`.trim()}>
            <div className={styles.exerciseZoneActionsContent}>
            <div className={styles.exerciseZoneActionsLeft}>
                {leftContent}
            </div>
            <div className={styles.exerciseZoneActionsRight}>
                {rightContent}
            </div>
            </div>
        </div>
    );
}