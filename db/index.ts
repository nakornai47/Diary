import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  categories: '@openhabittracker/categories',
  priorities: '@openhabittracker/priorities',
  habits: '@openhabittracker/habits',
  tasks: '@openhabittracker/tasks',
  notes: '@openhabittracker/notes',
  expenses: '@openhabittracker/expenses',
  settings: '@openhabittracker/settings',
  pinHash: '@openhabittracker/pin-hash',
};

export async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return defaultValue;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key}:`, e);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error(`Error removing ${key}:`, e);
  }
}

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
}
