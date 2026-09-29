import { create } from 'zustand';
import { Category, Priority, Habit, Task, Note, Expense } from '../models';
import { getItem, setItem, STORAGE_KEYS, clearAll } from '../db';
import { DEFAULT_CATEGORIES, DEFAULT_PRIORITIES } from '../constants';
import { SyncPayload } from '../types/sync';
import { addTombstone } from '../services/syncEngine';

type SyncCallback = () => void;

let syncCallback: SyncCallback | null = null;

export function registerDataChangeCallback(callback: SyncCallback | null): void {
  syncCallback = callback;
}

function notifySync(): void {
  if (syncCallback) syncCallback();
}

interface DataState {
  categories: Category[];
  priorities: Priority[];
  habits: Habit[];
  tasks: Task[];
  notes: Note[];
  expenses: Expense[];
  isLoaded: boolean;

  loadAll: () => Promise<void>;
  saveAll: () => Promise<void>;
  seedDefaults: () => Promise<void>;

  // Categories
  addCategory: (category: Omit<Category, 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Priorities
  addPriority: (priority: Omit<Priority, 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updatePriority: (priority: Priority) => Promise<void>;
  deletePriority: (id: string) => Promise<void>;

  // Habits
  addHabit: (habit: Omit<Habit, 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Tasks
  addTask: (task: Omit<Task, 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Notes
  addNote: (note: Omit<Note, 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Expenses
  addExpense: (expense: Omit<Expense, 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Sync
  applyRemoteData: (payload: SyncPayload) => Promise<void>;

  // Bulk
  resetAndImport: (data: { categories?: Category[]; priorities?: Priority[]; habits?: Habit[]; tasks?: Task[]; notes?: Note[]; expenses?: Expense[] }) => Promise<void>;
  clearAll: () => Promise<void>;
}

function now() {
  return Date.now();
}

export const useDataStore = create<DataState>((set, get) => ({
  categories: [],
  priorities: [],
  habits: [],
  tasks: [],
  notes: [],
  expenses: [],
  isLoaded: false,

  loadAll: async () => {
    const [categories, priorities, habits, tasks, notes, expenses] = await Promise.all([
      getItem<Category[]>(STORAGE_KEYS.categories, []),
      getItem<Priority[]>(STORAGE_KEYS.priorities, []),
      getItem<Habit[]>(STORAGE_KEYS.habits, []),
      getItem<Task[]>(STORAGE_KEYS.tasks, []),
      getItem<Note[]>(STORAGE_KEYS.notes, []),
      getItem<Expense[]>(STORAGE_KEYS.expenses, []),
    ]);
    set({ categories, priorities, habits, tasks, notes, expenses, isLoaded: true });
  },

  saveAll: async () => {
    const state = get();
    await Promise.all([
      setItem(STORAGE_KEYS.categories, state.categories),
      setItem(STORAGE_KEYS.priorities, state.priorities),
      setItem(STORAGE_KEYS.habits, state.habits),
      setItem(STORAGE_KEYS.tasks, state.tasks),
      setItem(STORAGE_KEYS.notes, state.notes),
      setItem(STORAGE_KEYS.expenses, state.expenses),
    ]);
  },

  seedDefaults: async () => {
    const state = get();
    const categories = [...state.categories];
    const priorities = [...state.priorities];

    DEFAULT_CATEGORIES.forEach((def, index) => {
      if (!categories.find((c) => c.name === def.name)) {
        const ts = now();
        categories.push({ id: `cat-${index}`, ...def, createdAt: ts, updatedAt: ts });
      }
    });

    DEFAULT_PRIORITIES.forEach((def, index) => {
      if (!priorities.find((p) => p.name === def.name)) {
        const ts = now();
        priorities.push({ id: `prio-${index}`, ...def, createdAt: ts, updatedAt: ts });
      }
    });

    set({ categories, priorities });
    await get().saveAll();
  },

  // Categories
  addCategory: async (category) => {
    const ts = now();
    const item: Category = { ...category, createdAt: ts, updatedAt: ts };
    set((state) => ({ categories: [...state.categories, item] }));
    await get().saveAll();
    notifySync();
  },
  updateCategory: async (category) => {
    const updated = { ...category, updatedAt: now() };
    set((state) => ({
      categories: state.categories.map((c) => (c.id === updated.id ? updated : c)),
    }));
    await get().saveAll();
    notifySync();
  },
  deleteCategory: async (id) => {
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
    await addTombstone(id);
    await get().saveAll();
    notifySync();
  },

  // Priorities
  addPriority: async (priority) => {
    const ts = now();
    const item: Priority = { ...priority, createdAt: ts, updatedAt: ts };
    set((state) => ({ priorities: [...state.priorities, item] }));
    await get().saveAll();
    notifySync();
  },
  updatePriority: async (priority) => {
    const updated = { ...priority, updatedAt: now() };
    set((state) => ({
      priorities: state.priorities.map((p) => (p.id === updated.id ? updated : p)),
    }));
    await get().saveAll();
    notifySync();
  },
  deletePriority: async (id) => {
    set((state) => ({ priorities: state.priorities.filter((p) => p.id !== id) }));
    await addTombstone(id);
    await get().saveAll();
    notifySync();
  },

  // Habits
  addHabit: async (habit) => {
    const ts = now();
    const item: Habit = { ...habit, createdAt: ts, updatedAt: ts };
    set((state) => ({ habits: [item, ...state.habits] }));
    await get().saveAll();
    notifySync();
  },
  updateHabit: async (habit) => {
    const updated = { ...habit, updatedAt: now() };
    set((state) => ({
      habits: state.habits.map((h) => (h.id === updated.id ? updated : h)),
    }));
    await get().saveAll();
    notifySync();
  },
  deleteHabit: async (id) => {
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }));
    await addTombstone(id);
    await get().saveAll();
    notifySync();
  },

  // Tasks
  addTask: async (task) => {
    const ts = now();
    const item: Task = { ...task, createdAt: ts, updatedAt: ts };
    set((state) => ({ tasks: [item, ...state.tasks] }));
    await get().saveAll();
    notifySync();
  },
  updateTask: async (task) => {
    const updated = { ...task, updatedAt: now() };
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === updated.id ? updated : t)),
    }));
    await get().saveAll();
    notifySync();
  },
  deleteTask: async (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    await addTombstone(id);
    await get().saveAll();
    notifySync();
  },

  // Notes
  addNote: async (note) => {
    const ts = now();
    const item: Note = { ...note, createdAt: ts, updatedAt: ts };
    set((state) => ({ notes: [item, ...state.notes] }));
    await get().saveAll();
    notifySync();
  },
  updateNote: async (note) => {
    const updated = { ...note, updatedAt: now() };
    set((state) => ({
      notes: state.notes.map((n) => (n.id === updated.id ? updated : n)),
    }));
    await get().saveAll();
    notifySync();
  },
  deleteNote: async (id) => {
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
    await addTombstone(id);
    await get().saveAll();
    notifySync();
  },

  // Expenses
  addExpense: async (expense) => {
    const ts = now();
    const item: Expense = { ...expense, createdAt: ts, updatedAt: ts };
    set((state) => ({ expenses: [item, ...state.expenses] }));
    await get().saveAll();
    notifySync();
  },
  updateExpense: async (expense) => {
    const updated = { ...expense, updatedAt: now() };
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === updated.id ? updated : e)),
    }));
    await get().saveAll();
    notifySync();
  },
  deleteExpense: async (id) => {
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
    await addTombstone(id);
    await get().saveAll();
    notifySync();
  },

  applyRemoteData: async (payload) => {
    set({
      categories: payload.categories,
      priorities: payload.priorities,
      habits: payload.habits,
      tasks: payload.tasks,
      notes: payload.notes,
      expenses: payload.expenses,
    });
    await get().saveAll();
  },

  resetAndImport: async (data) => {
    await clearAll();
    set({
      categories: data.categories || [],
      priorities: data.priorities || [],
      habits: data.habits || [],
      tasks: data.tasks || [],
      notes: data.notes || [],
      expenses: data.expenses || [],
    });
    await get().saveAll();
    notifySync();
  },

  clearAll: async () => {
    await clearAll();
    set({ categories: [], priorities: [], habits: [], tasks: [], notes: [], expenses: [] });
  },
}));
