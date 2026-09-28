import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { Category, Priority, Habit, Task, Note, Expense } from '../models';

export interface BackupData {
  version: number;
  exportedAt: number;
  categories: Category[];
  priorities: Priority[];
  habits: Habit[];
  tasks: Task[];
  notes: Note[];
  expenses: Expense[];
}

export function generateBackup(): BackupData {
  const state = useDataStore.getState();
  return {
    version: 1,
    exportedAt: Date.now(),
    categories: state.categories,
    priorities: state.priorities,
    habits: state.habits,
    tasks: state.tasks,
    notes: state.notes,
    expenses: state.expenses,
  };
}

export async function exportToJson(): Promise<void> {
  const data = generateBackup();
  const json = JSON.stringify(data, null, 2);
  const fileName = `openhabittracker-backup-${Date.now()}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const path = FileSystem.documentDirectory + fileName;
  await FileSystem.writeAsStringAsync(path, json);
  await Sharing.shareAsync(path);
}

export async function importFromJson(jsonText: string): Promise<void> {
  const data: BackupData = JSON.parse(jsonText);
  await useDataStore.getState().resetAndImport({
    categories: data.categories,
    priorities: data.priorities,
    habits: data.habits,
    tasks: data.tasks,
    notes: data.notes,
    expenses: data.expenses,
  });
}
