import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Card, Text, useTheme, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Habit, Task, Expense } from '../../models';
import { useDataStore } from '../../stores/dataStore';
import { useAppStore } from '../../stores/useAppStore';
import { calculateOverdue, isCompletedToday } from '../../components/lists/HabitListItem';
import { CURRENCY_OPTIONS } from '../../constants';
import { isToday, isPast } from 'date-fns';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useAppStore();
  const { habits, tasks, expenses, updateHabit, updateTask } = useDataStore();
  const currency = CURRENCY_OPTIONS.find((c) => c.value === settings.currency) || CURRENCY_OPTIONS[0];

  const dueHabits = useMemo(() => habits.filter((h) => !isCompletedToday(h)), [habits]);
  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) => !t.isDone && t.dueDate && (isPast(new Date(t.dueDate)) || isToday(new Date(t.dueDate)))
      ),
    [tasks]
  );
  const todayExpenses = useMemo(
    () => expenses.filter((e) => isToday(new Date(e.date))).reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  function completeHabit(habit: Habit) {
    updateHabit({ ...habit, completions: [...habit.completions, Date.now()] });
  }

  function toggleTask(task: Task) {
    updateTask({ ...task, isDone: !task.isDone, doneAt: !task.isDone ? Date.now() : null });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="วันนี้" />
        <Appbar.Action icon="cog" onPress={() => router.push('/settings')} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {dueHabits.length}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Habits ค้าง</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="headlineSmall" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                  {overdueTasks.length}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Tasks ครบกำหนด</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="headlineSmall" style={{ color: theme.colors.tertiary, fontWeight: 'bold' }}>
                  {currency.symbol}{todayExpenses.toLocaleString()}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>รายจ่ายวันนี้</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Section title="Habits ที่ต้องทำ" onMore={() => router.push('/habits')}>
          {dueHabits.slice(0, 3).map((habit) => {
            const { status } = calculateOverdue(habit);
            return (
              <Card key={habit.id} style={styles.miniCard} onPress={() => router.push(`/item/habit/${habit.id}`)}>
                <Card.Content style={styles.miniCardContent}>
                  <Text variant="bodyLarge" style={{ flex: 1 }} numberOfLines={1}>{habit.title}</Text>
                  <Button mode="text" compact onPress={() => completeHabit(habit)}>ทำแล้ว</Button>
                </Card.Content>
              </Card>
            );
          })}
          {dueHabits.length === 0 && <Text style={{ color: theme.colors.onSurfaceVariant }}>ไม่มี habits ค้าง เก่งมาก!</Text>}
        </Section>

        <Section title="Tasks ใกล้ครบกำหนด" onMore={() => router.push('/tasks')}>
          {overdueTasks.slice(0, 3).map((task) => (
            <Card key={task.id} style={styles.miniCard} onPress={() => router.push(`/item/task/${task.id}`)}>
              <Card.Content style={styles.miniCardContent}>
                <Text variant="bodyLarge" style={{ flex: 1, textDecorationLine: task.isDone ? 'line-through' : undefined }} numberOfLines={1}>
                  {task.title}
                </Text>
                <Button mode="text" compact onPress={() => toggleTask(task)}>
                  {task.isDone ? 'ยกเลิก' : 'เสร็จ'}
                </Button>
              </Card.Content>
            </Card>
          ))}
          {overdueTasks.length === 0 && <Text style={{ color: theme.colors.onSurfaceVariant }}>ไม่มี tasks ใกล้ครบกำหนด</Text>}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, onMore }: { title: string; children: React.ReactNode; onMore?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{title}</Text>
        {onMore && <Button mode="text" compact onPress={onMore}>ดูทั้งหมด</Button>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  summaryCard: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  miniCard: { marginBottom: 8 },
  miniCardContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
});
