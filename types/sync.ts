import {
  Category,
  Priority,
  Habit,
  Task,
  Note,
  Expense,
} from '../models';

export interface SyncConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey: string;
}

export interface SyncPayload {
  version: number;
  categories: Category[];
  priorities: Priority[];
  habits: Habit[];
  tasks: Task[];
  notes: Note[];
  expenses: Expense[];
  tombstones?: Record<string, number>;
}

export interface ServerData extends SyncPayload {
  serverTime: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: number | null;
  lastSyncError: string | null;
}

export interface PendingChange {
  id: string;
  entity: keyof SyncPayload;
  updatedAt: number;
}

export type SyncableEntity =
  | 'categories'
  | 'priorities'
  | 'habits'
  | 'tasks'
  | 'notes'
  | 'expenses';
