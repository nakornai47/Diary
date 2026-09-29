import fs from 'fs';
import path from 'path';
import { ServerData, SyncPayload } from './types';

const DEFAULT_DATA: ServerData = {
  version: 1,
  serverTime: Date.now(),
  categories: [],
  priorities: [],
  habits: [],
  tasks: [],
  notes: [],
  expenses: [],
  tombstones: {},
};

export class SyncStore {
  readonly dataDir: string;
  private dataFile: string;
  private backupDir: string;
  private maxBackups: number;

  constructor(dataDir: string = path.join(process.cwd(), 'data')) {
    this.dataDir = dataDir;
    this.dataFile = path.join(dataDir, 'sync-data.json');
    this.backupDir = path.join(dataDir, 'backups');
    this.maxBackups = 10;
    this.ensureDirs();
  }

  private ensureDirs(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  load(): ServerData {
    if (!fs.existsSync(this.dataFile)) {
      return { ...DEFAULT_DATA };
    }
    try {
      const raw = fs.readFileSync(this.dataFile, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ServerData>;
      return this.normalize(parsed);
    } catch (e) {
      console.error('Failed to load data file, using defaults:', e);
      return { ...DEFAULT_DATA };
    }
  }

  save(data: ServerData): void {
    const normalized = this.normalize(data);
    normalized.serverTime = Date.now();

    const tempFile = `${this.dataFile}.tmp`;
    const backupFile = path.join(
      this.backupDir,
      `sync-data-${Date.now()}.json`,
    );

    fs.writeFileSync(tempFile, JSON.stringify(normalized, null, 2));

    if (fs.existsSync(this.dataFile)) {
      fs.copyFileSync(this.dataFile, backupFile);
      this.rotateBackups();
    }

    fs.renameSync(tempFile, this.dataFile);
  }

  private rotateBackups(): void {
    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f: string) => f.startsWith('sync-data-') && f.endsWith('.json'))
        .map((f: string) => ({
          name: f,
          path: path.join(this.backupDir, f),
          time: fs.statSync(path.join(this.backupDir, f)).mtimeMs,
        }))
        .sort((a: { time: number }, b: { time: number }) => b.time - a.time);

      while (files.length > this.maxBackups) {
        const toRemove = files.pop();
        if (toRemove) {
          fs.unlinkSync(toRemove.path);
        }
      }
    } catch (e) {
      console.error('Failed to rotate backups:', e);
    }
  }

  private normalize(input: Partial<ServerData>): ServerData {
    return {
      version: input.version ?? DEFAULT_DATA.version,
      serverTime: input.serverTime ?? Date.now(),
      categories: input.categories ?? [],
      priorities: input.priorities ?? [],
      habits: input.habits ?? [],
      tasks: input.tasks ?? [],
      notes: input.notes ?? [],
      expenses: input.expenses ?? [],
      tombstones: input.tombstones ?? {},
    };
  }

  getSnapshot(): ServerData {
    return this.load();
  }

  applyMerge(merged: SyncPayload): ServerData {
    const data: ServerData = {
      ...merged,
      serverTime: Date.now(),
      version: 1,
    };
    this.save(data);
    return data;
  }
}
