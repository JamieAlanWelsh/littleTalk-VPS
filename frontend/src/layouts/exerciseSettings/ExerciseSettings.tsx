import styles from './exerciseSettings.module.css';
import type { ExerciseSettingsConfig } from './types';

interface ExerciseSettingsProps extends ExerciseSettingsConfig {
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseSettings = ({
  isOpen,
  onClose,
  title,
  subtitle,
  sections,
  onConfirm,
  onTutorial,
}: ExerciseSettingsProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>

        {/* Zone 1: Title */}
        <div className={styles.titleCard}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {/* Zone 2: Settings sections */}
        {sections.map((section, i) => (
          <div key={i} className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <ul className={styles.optionsList}>
              {section.options.map((option) => (
                <li
                  key={option.id}
                  className={`${styles.option} ${section.selectedId === option.id ? styles.optionSelected : ''}`}
                  onClick={() => section.onSelect(option.id)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Zone 3: Action buttons */}
        <div className={styles.actionsCard}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={() => { onConfirm(); onClose(); }}
          >
            Confirm &amp; Start
          </button>
          {/* If we add an inbuilt tutorial we will use this button */}
          {onTutorial && (
            <button className={styles.tutorialButton} onClick={onTutorial}>
              Tutorial / Tips
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ExerciseSettings;
