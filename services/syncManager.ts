import { AppState, AppStateStatus } from 'react-native';
import { useDataStore, registerDataChangeCallback } from '../stores/dataStore';
import { useSyncStore } from '../stores/syncStore';
import { checkServerHealth, pullFromServer, pushToServer, SyncError } from './syncApi';
import {
  buildSyncPayload,
  loadTombstones,
  mergeWithServerData,
  saveTombstones,
} from './syncEngine';
import { SYNC_DEFAULTS } from '../constants';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let periodicTimer: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;

function getDataState() {
  return useDataStore.getState();
}

function getSyncState() {
  return useSyncStore.getState();
}

export async function initializeSync(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  await getSyncState().loadConfig();
  await getSyncState().loadStatus();
  await getSyncState().loadDeviceId();

  registerDataChangeCallback(() => {
    scheduleSync(SYNC_DEFAULTS.debounceMs);
  });

  AppState.addEventListener('change', handleAppStateChange);

  startPeriodicSync();

  if (getSyncState().config.enabled) {
    scheduleSync(1_000);
  }
}

function handleAppStateChange(nextAppState: AppStateStatus): void {
  if (nextAppState === 'active' && getSyncState().config.enabled) {
    scheduleSync(500);
  }
}

function startPeriodicSync(): void {
  if (periodicTimer) return;
  periodicTimer = setInterval(() => {
    if (getSyncState().config.enabled) {
      scheduleSync(0);
    }
  }, SYNC_DEFAULTS.syncIntervalMs);
}

export function stopPeriodicSync(): void {
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
}

export function scheduleSync(delayMs: number = SYNC_DEFAULTS.debounceMs): void {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  const config = getSyncState().config;
  if (!config.enabled || !config.serverUrl || !config.apiKey) {
    return;
  }

  syncTimer = setTimeout(() => {
    syncTimer = null;
    performSync().catch(() => {
      // Errors are already recorded in syncStore
    });
  }, delayMs);
}

async function waitForDataLoaded(maxWaitMs: number = 10_000): Promise<boolean> {
  const start = Date.now();
  while (!getDataState().isLoaded) {
    if (Date.now() - start > maxWaitMs) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return true;
}

export async function performSync(): Promise<void> {
  const syncState = getSyncState();
  const config = syncState.config;

  if (!config.enabled || !config.serverUrl || !config.apiKey) {
    return;
  }

  if (syncState.status.isSyncing) {
    return;
  }

  const isLoaded = await waitForDataLoaded();
  if (!isLoaded) {
    syncState.setStatus({
      isSyncing: false,
      lastSyncError: 'Local data not loaded yet',
    });
    return;
  }

  syncState.setStatus({ isSyncing: true, lastSyncError: null });

  try {
    const dataState = getDataState();
    const tombstones = await loadTombstones();
    const localPayload = buildSyncPayload(
      dataState.categories,
      dataState.priorities,
      dataState.habits,
      dataState.tasks,
      dataState.notes,
      dataState.expenses,
      tombstones,
    );

    const serverData = await pullFromServer(config);
    const merged = mergeWithServerData(localPayload, serverData);

    // Push merged data to server; server returns canonical state
    const canonical = await pushToServer(config, merged);

    // Save merged tombstones
    if (canonical.tombstones) {
      await saveTombstones(canonical.tombstones);
    }

    // Apply remote data to local store
    await dataState.applyRemoteData(canonical);

    syncState.setStatus({
      isSyncing: false,
      lastSyncAt: canonical.serverTime,
      lastSyncError: null,
    });
  } catch (error) {
    const message =
      error instanceof SyncError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Sync failed';
    syncState.setStatus({ isSyncing: false, lastSyncError: message });
  }
}

export async function testConnection(serverUrl: string, apiKey: string): Promise<string> {
  if (!serverUrl.trim()) {
    throw new Error('กรุณาระบุ Server URL');
  }
  if (!apiKey.trim()) {
    throw new Error('กรุณาระบุ API Key');
  }

  const serverTime = await checkServerHealth({
    enabled: true,
    serverUrl: serverUrl.trim(),
    apiKey: apiKey.trim(),
  });

  return `เชื่อมต่อสำเร็จ (server time: ${new Date(serverTime).toLocaleString()})`;
}
