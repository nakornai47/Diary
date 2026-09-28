import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, Checkbox, useTheme } from 'react-native-paper';
import { Task, Category, Priority } from '../../models';
import CategoryChip from '../ui/CategoryChip';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

interface Props {
  task: Task;
  category?: Category | null;
  priority?: Priority | null;
  onPress: () => void;
  onToggle: () => void;
}

function formatDueDate(dueDate: number | null, theme: any): { text: string; color: string } {
  if (!dueDate) return { text: 'ไม่กำหนดวัน', color: theme.colors.onSurfaceVariant };
  const date = new Date(dueDate);
  if (isToday(date)) return { text: 'วันนี้', color: theme.colors.primary };
  if (isTomorrow(date)) return { text: 'พรุ่งนี้', color: theme.colors.primary };
  if (isPast(date) && !isToday(date)) return { text: format(date, 'dd MMM yyyy'), color: theme.colors.error };
  return { text: format(date, 'dd MMM yyyy'), color: theme.colors.onSurfaceVariant };
}

export default function TaskListItem({ task, category, priority, onPress, onToggle }: Props) {
  const theme = useTheme();
  const due = formatDueDate(task.dueDate, theme);

  return (
    <Card style={[styles.card, task.isDone && { opacity: 0.7 }]} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <Checkbox status={task.isDone ? 'checked' : 'unchecked'} onPress={onToggle} />
          <View style={styles.info}>
            <Text variant="titleMedium" numberOfLines={1} style={task.isDone && { textDecorationLine: 'line-through' }}>
              {task.title}
            </Text>
            <View style={styles.chips}>
              <CategoryChip category={category} priority={priority} compact />
              <Text variant="bodySmall" style={{ color: due.color }}>
                {due.text}
              </Text>
              {task.checklist.length > 0 && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {task.checklist.filter((i) => i.isDone).length}/{task.checklist.length}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6 },
  content: { paddingVertical: 8, paddingHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: 8 },
  chips: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 },
});
