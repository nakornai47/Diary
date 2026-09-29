import { create } from 'zustand';
import { SyncConfig, SyncStatus } from '../types/sync';
import { getItem, setItem, STORAGE_KEYS } from '../db';

export const defaultSyncConfig: SyncConfig = {
  enabled: false,
  serverUrl: '',
  apiKey: '',
};

export const defaultSyncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncAt: null,
  lastSyncError: null,
};

interface SyncState {
  config: SyncConfig;
  status: SyncStatus;
  deviceId: string;

  loadConfig: () => Promise<void>;
  saveConfig: (config: SyncConfig) => Promise<void>;
  setConfig: (config: SyncConfig) => void;

  loadStatus: () => Promise<void>;
  saveStatus: () => Promise<void>;
  setStatus: (status: Partial<SyncStatus>) => void;

  loadDeviceId: () => Promise<void>;
  setDeviceId: (deviceId: string) => Promise<void>;
}

function generateDeviceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  config: defaultSyncConfig,
  status: defaultSyncStatus,
  deviceId: '',

  loadConfig: async () => {
    const config = await getItem<SyncConfig>(STORAGE_KEYS.syncConfig, defaultSyncConfig);
    set({ config });
  },

  saveConfig: async (config) => {
    set({ config });
    await setItem(STORAGE_KEYS.syncConfig, config);
  },

  setConfig: (config) => {
    set({ config });
  },

  loadStatus: async () => {
    const status = await getItem<SyncStatus>(STORAGE_KEYS.syncStatus, defaultSyncStatus);
    set({ status });
  },

  saveStatus: async () => {
    await setItem(STORAGE_KEYS.syncStatus, get().status);
  },

  setStatus: (status) => {
    set((state) => ({ status: { ...state.status, ...status } }));
    // Persist status changes asynchronously without awaiting
    get().saveStatus();
  },

  loadDeviceId: async () => {
    let deviceId = await getItem<string>(STORAGE_KEYS.syncDeviceId, '');
    if (!deviceId) {
      deviceId = generateDeviceId();
      await setItem(STORAGE_KEYS.syncDeviceId, deviceId);
    }
    set({ deviceId });
  },

  setDeviceId: async (deviceId) => {
    set({ deviceId });
    await setItem(STORAGE_KEYS.syncDeviceId, deviceId);
  },
}));
