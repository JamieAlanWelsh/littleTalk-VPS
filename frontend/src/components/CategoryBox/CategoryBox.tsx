import { DroppableImageZone } from "../DroppableImageZone/DroppableImageZone";
import styles from "./CategoryBox.module.css";

interface CategoryBoxProps {
    categoryId: string;
    title: string;
    slotCount: number;
    borderColor?: string;
    renderSlot?: (slotId: string, slotIndex: number) => React.ReactNode;
}

export const CategoryBox = ({
    categoryId,
    title,
    slotCount,
    borderColor,
    renderSlot,
}: CategoryBoxProps) => {
    const slotIds = Array.from({ length: slotCount }, (_, slotIndex) => ({
        slotIndex,
        slotId: `slot:${categoryId}:${slotIndex}`,
    }));

    return (
        <section
            className={styles.categoryBox}
            style={{
                ["--category-box-border" as string]: borderColor ?? "#ff6b6b",
            }}
        >
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.grid}>
                {slotIds.map(({ slotId, slotIndex }) => (
                    <DroppableImageZone key={slotId} id={slotId}>
                        {renderSlot?.(slotId, slotIndex)}
                    </DroppableImageZone>
                ))}
            </div>
        </section>
    );
};

export default CategoryBox;
