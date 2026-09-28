import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { Expense, Category } from '../../models';
import CategoryChip from '../ui/CategoryChip';
import { format } from 'date-fns';
import { useAppStore } from '../../stores/useAppStore';
import { CURRENCY_OPTIONS } from '../../constants';

interface Props {
  expense: Expense;
  category?: Category | null;
  onPress: () => void;
}

export default function ExpenseListItem({ expense, category, onPress }: Props) {
  const theme = useTheme();
  const { settings } = useAppStore();
  const currency = CURRENCY_OPTIONS.find((c) => c.value === settings.currency) || CURRENCY_OPTIONS[0];

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text variant="titleMedium" numberOfLines={1}>
              {expense.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {format(new Date(expense.date), 'dd MMM yyyy')}
            </Text>
            <View style={styles.chips}>
              <CategoryChip category={category} compact />
            </View>
          </View>
          <Text variant="titleMedium" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
            {currency.symbol}{expense.amount.toLocaleString()}
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
  info: { flex: 1, marginRight: 12 },
  chips: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
});
