import type { ReactNode } from "react";
import type { AnswerState } from "../../lib/types";
import styles from "./exerciseActionBar.module.css";
import Button from "../Button/Button";

interface ExerciseActionBar {
  actionBarPhase: AnswerState;
  feedbackMessage: string;
  onCheckAnswer: () => void;
  onTryAgain: () => void;
  onContinue: () => void;
  onSkip: () => void;
}

export default ({
  actionBarPhase,
  feedbackMessage,
  onCheckAnswer,
  onTryAgain,
  onContinue,
  onSkip,
}: ExerciseActionBar) => {
  let toneClass = "";
  let leftContent: ReactNode = null;
  let rightContent: ReactNode = null;

  switch (actionBarPhase) {
    case "notAnswered":
      leftContent = (
        <Button label="Skip" onClick={onSkip} variant="secondary" />
      );
      rightContent = <Button label="Check" onClick={onCheckAnswer} />;
      break;
    case "correct":
      toneClass = styles.exerciseZoneActionsCorrect;
      leftContent = (
        <p className={styles.exerciseZoneActionsMessage}>{feedbackMessage}</p>
      );
      rightContent = <Button label="Continue" onClick={onContinue} />;
      break;
    case "incorrect":
      toneClass = styles.exerciseZoneActionsIncorrect;
      leftContent = (
        <>
          <p className={styles.exerciseZoneActionsMessage}>{feedbackMessage}</p>
          <Button label="Try Again" onClick={onTryAgain} variant="secondary" />
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
        <div className={styles.exerciseZoneActionsLeft}>{leftContent}</div>
        <div className={styles.exerciseZoneActionsRight}>{rightContent}</div>
      </div>
    </div>
  );
};
