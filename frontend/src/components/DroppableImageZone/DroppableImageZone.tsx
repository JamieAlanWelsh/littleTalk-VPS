import { useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
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
    const { isDropTarget, ref } = useDroppable({
        id,
        accept: "draggable-image",
        collisionPriority: CollisionPriority.Low,
    });

    return (
        <div
            className={`${styles.zone} ${className ?? ""} ${isDropTarget ? styles.active : ""}`.trim()}
            ref={ref}
        >
            <div className={styles.content}>{children}</div>
        </div>
    );
};
