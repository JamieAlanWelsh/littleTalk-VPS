import type { ReactNode } from "react";
import type { AnswerState } from "../../lib/types";
import styles from "./exerciseActionBar.module.css";
import Button from "../Button/Button";
import { TypeAnimation } from "react-type-animation";

interface ExerciseActionBar {
    actionBarPhase: AnswerState;
    feedbackMessage: string;
    showSkip?: boolean;
    disableCheck?: boolean;
    onCheckAnswer: () => void;
    onTryAgain: () => void;
    onContinue: () => void;
    onSkip: () => void;
}

const ExerciseActionBar = ({
    actionBarPhase,
    feedbackMessage,
    showSkip = true,
    disableCheck = false,
    onCheckAnswer,
    onTryAgain,
    onContinue,
    onSkip,
}: ExerciseActionBar) => {
    const renderFeedbackMessage = () => (
        <p className={styles.exerciseZoneActionsMessage}>
            <TypeAnimation
                key={`${actionBarPhase}-${feedbackMessage}`}
                sequence={[feedbackMessage]}
                speed={60}
                cursor={false}
            />
        </p>
    );

    let toneClass = "";
    let leftContent: ReactNode = null;
    let rightContent: ReactNode = null;

    switch (actionBarPhase) {
        case "notAnswered":
            leftContent = showSkip ? (
                <Button label="Skip" onClick={onSkip} variant="secondary" />
            ) : null;
            rightContent = (
                <Button
                    label="Check"
                    onClick={onCheckAnswer}
                    disabled={disableCheck}
                />
            );
            break;
        case "correct":
            toneClass = styles.exerciseZoneActionsCorrect;
            leftContent = renderFeedbackMessage();
            rightContent = <Button label="Continue" onClick={onContinue} />;
            break;
        case "incorrect":
            toneClass = styles.exerciseZoneActionsIncorrect;
            leftContent = renderFeedbackMessage();
            rightContent = (
                <Button
                    label="Try Again"
                    onClick={onTryAgain}
                    variant="secondary"
                />
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
};

export default ExerciseActionBar;
