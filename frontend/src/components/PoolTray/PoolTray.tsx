import { useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
import styles from "./PoolTray.module.css";

interface PoolTrayProps {
    id: string;
    itemIds: string[];
    title?: string;
    renderItem?: (itemId: string) => React.ReactNode;
}

export const PoolTray = ({
    id,
    itemIds,
    title = "Options",
    renderItem,
}: PoolTrayProps) => {
    const { isDropTarget, ref } = useDroppable({
        id,
        accept: "draggable-image",
        collisionPriority: CollisionPriority.Low,
    });

    return (
        <section className={styles.tray}>
            <h3 className={styles.title}>{title}</h3>
            <div
                className={`${styles.dropZone} ${isDropTarget ? styles.active : ""}`.trim()}
                ref={ref}
            >
                {itemIds.length > 0 ? (
                    <div className={styles.items}>
                        {itemIds.map((itemId) =>
                            renderItem ? (
                                renderItem(itemId)
                            ) : (
                                <span key={itemId}>{itemId}</span>
                            ),
                        )}
                    </div>
                ) : (
                    <p className={styles.emptyState}>
                        Drag items back here to return them to the tray.
                    </p>
                )}
            </div>
        </section>
    );
};

export default PoolTray;
