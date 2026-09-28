import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, IconButton, useTheme } from 'react-native-paper';
import { Habit, Category, Priority } from '../../models';
import CategoryChip from '../ui/CategoryChip';
import { format, isSameDay } from 'date-fns';

interface Props {
  habit: Habit;
  category?: Category | null;
  priority?: Priority | null;
  onPress: () => void;
  onComplete: () => void;
}

export function calculateOverdue(habit: Habit): { percent: number; status: string } {
  if (habit.completions.length === 0) {
    return { percent: 1, status: 'ยังไม่เคยทำ' };
  }
  const last = Math.max(...habit.completions);
  const now = Date.now();
  const daysSince = (now - last) / (1000 * 60 * 60 * 24);
  const percent = Math.min(daysSince / habit.intervalDays, 2);
  const status = percent >= 1 ? 'ครบกำหนด' : `${Math.round(percent * 100)}%`;
  return { percent: percent / 2, status };
}

export function isCompletedToday(habit: Habit): boolean {
  const today = new Date();
  return habit.completions.some((ts) => isSameDay(new Date(ts), today));
}

export default function HabitListItem({ habit, category, priority, onPress, onComplete }: Props) {
  const theme = useTheme();
  const { percent, status } = calculateOverdue(habit);
  const completedToday = isCompletedToday(habit);

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text variant="titleMedium" numberOfLines={1}>
              {habit.title}
            </Text>
            <View style={styles.chips}>
              <CategoryChip category={category} priority={priority} compact />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                ทุก {habit.intervalDays} วัน
              </Text>
            </View>
          </View>
          <IconButton
            icon={completedToday ? 'check-circle' : 'checkbox-blank-circle-outline'}
            iconColor={completedToday ? theme.colors.primary : theme.colors.onSurfaceVariant}
            size={28}
            onPress={onComplete}
          />
        </View>
        <View style={styles.progressRow}>
          <ProgressBar progress={percent} color={percent > 0.5 ? theme.colors.error : theme.colors.primary} style={styles.progress} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
            {status}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6 },
  content: { paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1, marginRight: 8 },
  chips: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  progress: { flex: 1, height: 6, borderRadius: 3 },
});
