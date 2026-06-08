import { useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
import styles from "./PoolTray.module.css";

interface PoolTrayProps {
    id: string;
    itemIds: string[];
    getItemLabel?: (itemId: string) => string | undefined;
    renderItem?: (itemId: string) => React.ReactNode;
    itemsById?: Record<string, { label?: string }>;
}

const ITEMS_PER_VIEW = 5;

export const PoolTray = ({
    id,
    itemIds,
    getItemLabel,
    renderItem,
    itemsById = {},
}: PoolTrayProps) => {
    const { isDropTarget, ref } = useDroppable({
        id,
        accept: "draggable-image",
        collisionPriority: CollisionPriority.Low,
    });

    const visibleItems = itemIds.slice(0, ITEMS_PER_VIEW);

    return (
        <section className={styles.tray}>
            <div
                className={`${styles.dropZone} ${isDropTarget ? styles.active : ""}`.trim()}
                ref={ref}
            >
                {itemIds.length > 0 ? (
                    <div className={styles.itemsContainer}>
                        <div className={styles.items} key={`items`}>
                            {visibleItems.map((itemId) =>
                                renderItem ? (
                                    <div
                                        key={itemId}
                                        className={styles.itemWrapper}
                                    >
                                        {renderItem(itemId)}
                                        {(getItemLabel?.(itemId) ??
                                            itemsById[itemId]?.label) && (
                                            <p className={styles.itemLabel}>
                                                {getItemLabel?.(itemId) ??
                                                    itemsById[itemId]?.label}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <span key={itemId}>{itemId}</span>
                                ),
                            )}
                        </div>
                    </div>
                ) : (
                    <p className={styles.emptyState}>
                        All done? Tap ‘Check’ to see how you did!
                    </p>
                )}
            </div>
        </section>
    );
};

export default PoolTray;
