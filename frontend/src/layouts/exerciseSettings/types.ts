export interface SettingsOption {
  id: string;
  label: string;
}

export interface SettingsSection {
  title: string;
  options: SettingsOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export interface ExerciseSettingsConfig {
  title: string;
  subtitle?: string;
  sections: SettingsSection[];
  onConfirm: () => void;
  onTutorial?: () => void;
}
