import { create } from 'zustand';
import { AppSettings } from '../models';
import { getItem, setItem, STORAGE_KEYS } from '../db';

interface AppState {
  settings: AppSettings;
  isReady: boolean;
  isAuthenticated: boolean;
  setSettings: (settings: AppSettings) => void;
  setIsReady: (isReady: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'th',
  currency: 'THB',
  pinEnabled: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  settings: defaultSettings,
  isReady: false,
  isAuthenticated: false,
  setSettings: (settings) => {
    set({ settings });
    get().saveSettings();
  },
  setIsReady: (isReady) => set({ isReady }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  loadSettings: async () => {
    const settings = await getItem<AppSettings>(STORAGE_KEYS.settings, defaultSettings);
    set({ settings });
  },
  saveSettings: async () => {
    await setItem(STORAGE_KEYS.settings, get().settings);
  },
}));
