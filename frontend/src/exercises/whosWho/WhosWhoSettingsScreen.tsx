import styles from "./WhosWhoSettingsScreen.module.css";

interface WhosWhoSettingsScreenProps {
    instruction: string;
    modellingTip?: string;
}

export const WhosWhoSettingsScreen = ({
    instruction,
    modellingTip,
}: WhosWhoSettingsScreenProps) => {
    return (
        <div className={styles.wrapper}>
            <p className={styles.text}>{instruction}</p>
            <ul className={styles.list}>
                <li>Two people or groups are shown in each round.</li>
                <li>
                    Drag one of three objects to the person named by the
                    pronoun.
                </li>
                <li>Press Check after you drag your answer.</li>
                <li>Complete 5 rounds to finish.</li>
            </ul>
            {modellingTip ? <p className={styles.tip}>{modellingTip}</p> : null}
        </div>
    );
};

export default WhosWhoSettingsScreen;
