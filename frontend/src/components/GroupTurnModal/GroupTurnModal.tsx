import { useEffect, useRef, useState } from "react";
import Button from "../Button/Button";
import Modal from "../Modal/Modal";
import styles from "./GroupTurnModal.module.css";

const CLOSE_ANIMATION_MS = 200;

interface GroupTurnModalProps {
    isOpen: boolean;
    learnerName: string;
    avatarImageUrl: string;
    avatarColor: string;
    onStart: () => void;
}

export const GroupTurnModal = ({
    isOpen,
    learnerName,
    avatarImageUrl,
    avatarColor,
    onStart,
}: GroupTurnModalProps) => {
    const [isClosing, setIsClosing] = useState(false);
    const closeTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current !== null) {
                window.clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const handleStart = () => {
        if (isClosing) {
            return;
        }

        setIsClosing(true);
        closeTimeoutRef.current = window.setTimeout(() => {
            onStart();
        }, CLOSE_ANIMATION_MS);
    };

    return (
        <Modal isOpen={isOpen} onClose={handleStart}>
            <div
                className={`${styles.container} ${isClosing ? styles.containerClosing : ""}`.trim()}
            >
                <div className={styles.avatarShell} aria-hidden="true">
                    <div
                        className={styles.avatar}
                        style={{ backgroundColor: avatarColor }}
                    >
                        <img
                            src={avatarImageUrl}
                            alt=""
                            className={styles.avatarImage}
                        />
                    </div>
                </div>
                <h2 className={styles.title}>{learnerName}&apos;s turn</h2>
                <div className={styles.buttonGroup}>
                    <Button
                        label="Start"
                        variant="primary"
                        onClick={handleStart}
                        width="100%"
                        disabled={isClosing}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default GroupTurnModal;
