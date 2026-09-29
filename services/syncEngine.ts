import {
  Category,
  Priority,
  Habit,
  Task,
  Note,
  Expense,
} from '../models';
import {
  SyncPayload,
  ServerData,
  SyncableEntity,
} from '../types/sync';
import { getItem, setItem, STORAGE_KEYS } from '../db';

type EntityWithTimestamps =
  | Category
  | Priority
  | Habit
  | Task
  | Note
  | Expense;

const ENTITY_ORDER: SyncableEntity[] = [
  'categories',
  'priorities',
  'habits',
  'tasks',
  'notes',
  'expenses',
];

export function buildSyncPayload(
  categories: Category[],
  priorities: Priority[],
  habits: Habit[],
  tasks: Task[],
  notes: Note[],
  expenses: Expense[],
  tombstones: Record<string, number> = {},
): SyncPayload {
  return {
    version: 1,
    categories,
    priorities,
    habits,
    tasks,
    notes,
    expenses,
    tombstones,
  };
}

function getEffectiveTime(entity: EntityWithTimestamps): number {
  return Math.max(entity.updatedAt, entity.deletedAt ?? 0);
}

function mergeEntityArrays<T extends EntityWithTimestamps>(
  local: T[],
  remote: T[],
  tombstones: Record<string, number>,
): T[] {
  const map = new Map<string, T>();

  for (const item of local) {
    map.set(item.id, item);
  }

  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    if (getEffectiveTime(item) > getEffectiveTime(existing)) {
      map.set(item.id, item);
    }
  }

  for (const [id, deletedAt] of Object.entries(tombstones)) {
    const item = map.get(id);
    if (item && deletedAt >= getEffectiveTime(item)) {
      map.delete(id);
    }
  }

  return Array.from(map.values());
}

export function mergeWithServerData(
  localPayload: SyncPayload,
  serverData: ServerData,
): SyncPayload {
  const mergedTombstones: Record<string, number> = {
    ...(localPayload.tombstones ?? {}),
    ...(serverData.tombstones ?? {}),
  };

  // Promote deletedAt markers from both sides into tombstones
  for (const name of ENTITY_ORDER) {
    const entities = localPayload[name] as EntityWithTimestamps[];
    for (const entity of entities) {
      if (entity.deletedAt && entity.deletedAt > (mergedTombstones[entity.id] ?? 0)) {
        mergedTombstones[entity.id] = entity.deletedAt;
      }
    }
    const serverEntities = (serverData[name] ?? []) as EntityWithTimestamps[];
    for (const entity of serverEntities) {
      if (entity.deletedAt && entity.deletedAt > (mergedTombstones[entity.id] ?? 0)) {
        mergedTombstones[entity.id] = entity.deletedAt;
      }
    }
  }

  return {
    version: 1,
    categories: mergeEntityArrays(
      localPayload.categories,
      serverData.categories ?? [],
      mergedTombstones,
    ),
    priorities: mergeEntityArrays(
      localPayload.priorities,
      serverData.priorities ?? [],
      mergedTombstones,
    ),
    habits: mergeEntityArrays(
      localPayload.habits,
      serverData.habits ?? [],
      mergedTombstones,
    ),
    tasks: mergeEntityArrays(
      localPayload.tasks,
      serverData.tasks ?? [],
      mergedTombstones,
    ),
    notes: mergeEntityArrays(
      localPayload.notes,
      serverData.notes ?? [],
      mergedTombstones,
    ),
    expenses: mergeEntityArrays(
      localPayload.expenses,
      serverData.expenses ?? [],
      mergedTombstones,
    ),
    tombstones: mergedTombstones,
  };
}

export async function loadTombstones(): Promise<Record<string, number>> {
  return getItem<Record<string, number>>(STORAGE_KEYS.syncTombstones, {});
}

export async function saveTombstones(tombstones: Record<string, number>): Promise<void> {
  await setItem(STORAGE_KEYS.syncTombstones, tombstones);
}

export async function addTombstone(id: string): Promise<void> {
  const tombstones = await loadTombstones();
  tombstones[id] = Date.now();
  await saveTombstones(tombstones);
}
