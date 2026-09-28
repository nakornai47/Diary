import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ItemType, Habit, Task, Note, Expense } from '../../../models';
import { useDataStore } from '../../../stores/dataStore';
import ItemForm from '../../../components/forms/ItemForm';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { type, id } = useLocalSearchParams<{ type: ItemType; id: string }>();
  const isNew = id === 'new';

  const { habits, tasks, notes, expenses, addHabit, updateHabit, addTask, updateTask, addNote, updateNote, addExpense, updateExpense, deleteHabit, deleteTask, deleteNote, deleteExpense } = useDataStore();

  const item = useMemo<Partial<Habit & Task & Note & Expense>>(() => {
    if (isNew) return {};
    switch (type) {
      case 'habit':
        return habits.find((h) => h.id === id) || {};
      case 'task':
        return tasks.find((t) => t.id === id) || {};
      case 'note':
        return notes.find((n) => n.id === id) || {};
      case 'expense':
        return expenses.find((e) => e.id === id) || {};
      default:
        return {};
    }
  }, [type, id, habits, tasks, notes, expenses, isNew]);

  function generateId() {
    return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function handleSave(data: any) {
    switch (type) {
      case 'habit': {
        const existingHabit = item as Habit;
        const habit: Habit = {
          ...data,
          id: isNew ? generateId() : existingHabit.id!,
          completions: existingHabit.completions || [],
          createdAt: existingHabit.createdAt,
        } as Habit;
        if (isNew) addHabit(habit);
        else updateHabit(habit);
        break;
      }
      case 'task': {
        const existingTask = item as Task;
        const task: Task = {
          ...data,
          id: isNew ? generateId() : existingTask.id!,
          isDone: existingTask.isDone || false,
          doneAt: existingTask.doneAt || null,
          duration: existingTask.duration || null,
          createdAt: existingTask.createdAt,
        } as Task;
        if (isNew) addTask(task);
        else updateTask(task);
        break;
      }
      case 'note': {
        const existingNote = item as Note;
        const note: Note = {
          ...data,
          id: isNew ? generateId() : existingNote.id!,
          createdAt: existingNote.createdAt,
        } as Note;
        if (isNew) addNote(note);
        else updateNote(note);
        break;
      }
      case 'expense': {
        const existingExpense = item as Expense;
        const expense: Expense = {
          ...data,
          id: isNew ? generateId() : existingExpense.id!,
          createdAt: existingExpense.createdAt,
        } as Expense;
        if (isNew) addExpense(expense);
        else updateExpense(expense);
        break;
      }
    }
    router.back();
  }

  function handleDelete() {
    switch (type) {
      case 'habit':
        deleteHabit(item.id!);
        break;
      case 'task':
        deleteTask(item.id!);
        break;
      case 'note':
        deleteNote(item.id!);
        break;
      case 'expense':
        deleteExpense(item.id!);
        break;
    }
    router.back();
  }

  const titles: Record<ItemType, string> = {
    habit: 'Habit',
    task: 'Task',
    note: 'Note',
    expense: 'รายจ่าย',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: `${isNew ? 'เพิ่ม' : 'แก้ไข'}${titles[type]}` }} />
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={`${isNew ? 'เพิ่ม' : 'แก้ไข'}${titles[type]}`} />
      </Appbar.Header>
      <ItemForm type={type} item={item} onSave={handleSave} onDelete={isNew ? undefined : handleDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
