export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Priority {
  id: string;
  name: string;
  color: string;
  level: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Habit {
  id: string;
  title: string;
  categoryId: string | null;
  priorityId: string | null;
  intervalDays: number;
  completions: number[];
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  isDone: boolean;
}

export interface Task {
  id: string;
  title: string;
  text: string;
  categoryId: string | null;
  priorityId: string | null;
  dueDate: number | null;
  duration: number | null;
  checklist: ChecklistItem[];
  isDone: boolean;
  doneAt: number | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  priorityId: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: number;
  categoryId: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export type EntityName =
  | 'categories'
  | 'priorities'
  | 'habits'
  | 'tasks'
  | 'notes'
  | 'expenses';

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

export type EntityArray =
  | Category[]
  | Priority[]
  | Habit[]
  | Task[]
  | Note[]
  | Expense[];
