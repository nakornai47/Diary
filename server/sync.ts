import {
  ServerData,
  SyncPayload,
  EntityName,
  EntityArray,
} from './types';

type EntityWithTimestamps = {
  id: string;
  updatedAt: number;
  deletedAt?: number;
};

const ENTITY_NAMES: EntityName[] = [
  'categories',
  'priorities',
  'habits',
  'tasks',
  'notes',
  'expenses',
];

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

    const existingTime = Math.max(
      existing.updatedAt,
      existing.deletedAt ?? 0,
    );
    const remoteTime = Math.max(item.updatedAt, item.deletedAt ?? 0);

    if (remoteTime > existingTime) {
      map.set(item.id, item);
    }
  }

  // Apply tombstones: remove items that were deleted after the last known update
  for (const [id, deletedAt] of Object.entries(tombstones)) {
    const item = map.get(id);
    if (item) {
      const itemTime = Math.max(item.updatedAt, item.deletedAt ?? 0);
      if (deletedAt >= itemTime) {
        map.delete(id);
      }
    }
  }

  return Array.from(map.values());
}

export function mergeSyncPayload(
  serverData: ServerData,
  clientPayload: SyncPayload,
): ServerData {
  const mergedTombstones: Record<string, number> = {
    ...serverData.tombstones,
    ...(clientPayload.tombstones ?? {}),
  };

  // Promote client-side deletedAt into tombstones so server keeps them
  for (const name of ENTITY_NAMES) {
    const clientEntities = clientPayload[name] as EntityWithTimestamps[];
    for (const entity of clientEntities) {
      if (entity.deletedAt) {
        const existing = mergedTombstones[entity.id] ?? 0;
        if (entity.deletedAt > existing) {
          mergedTombstones[entity.id] = entity.deletedAt;
        }
      }
    }
  }

  const merged: ServerData = {
    version: 1,
    serverTime: Date.now(),
    categories: mergeEntityArrays(
      serverData.categories,
      clientPayload.categories,
      mergedTombstones,
    ),
    priorities: mergeEntityArrays(
      serverData.priorities,
      clientPayload.priorities,
      mergedTombstones,
    ),
    habits: mergeEntityArrays(
      serverData.habits,
      clientPayload.habits,
      mergedTombstones,
    ),
    tasks: mergeEntityArrays(
      serverData.tasks,
      clientPayload.tasks,
      mergedTombstones,
    ),
    notes: mergeEntityArrays(
      serverData.notes,
      clientPayload.notes,
      mergedTombstones,
    ),
    expenses: mergeEntityArrays(
      serverData.expenses,
      clientPayload.expenses,
      mergedTombstones,
    ),
    tombstones: mergedTombstones,
  };

  return merged;
}
