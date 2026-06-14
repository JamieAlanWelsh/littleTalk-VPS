import { useDroppable } from "@dnd-kit/core";
import styles from "./DroppableImageZone.module.css";

interface DroppableImageZoneProps {
    id: string;
    className?: string;
    children?: React.ReactNode;
}

export const DroppableImageZone = ({
    id,
    className,
    children,
}: DroppableImageZoneProps) => {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            className={`${styles.zone} ${className ?? ""} ${isOver ? styles.active : ""}`.trim()}
            ref={setNodeRef}
        >
            <div className={styles.content}>{children}</div>
        </div>
    );
};
