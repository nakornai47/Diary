import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, FAB, useTheme, Searchbar, Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDataStore } from '../../stores/dataStore';
import { useAppStore } from '../../stores/useAppStore';
import ExpenseListItem from '../../components/lists/ExpenseListItem';
import EmptyState from '../../components/ui/EmptyState';
import { CURRENCY_OPTIONS } from '../../constants';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function ExpensesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { expenses, categories } = useDataStore();
  const { settings } = useAppStore();
  const [search, setSearch] = useState('');
  const currency = CURRENCY_OPTIONS.find((c) => c.value === settings.currency) || CURRENCY_OPTIONS[0];

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.title.toLowerCase().includes(search.toLowerCase())),
    [expenses, search]
  );

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => isWithinInterval(new Date(e.date), { start: startOfMonth(now), end: endOfMonth(now) }))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="รายจ่าย" />
      </Appbar.Header>
      <Searchbar
        placeholder="ค้นหารายจ่าย"
        onChangeText={setSearch}
        value={search}
        style={styles.search}
      />
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            ยอดรายจ่ายเดือนนี้
          </Text>
          <Text variant="headlineMedium" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
            {currency.symbol}{thisMonthTotal.toLocaleString()}
          </Text>
        </Card.Content>
      </Card>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ExpenseListItem
            expense={item}
            category={categories.find((c) => c.id === item.categoryId)}
            onPress={() => router.push(`/item/expense/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cash-multiple"
            title="ยังไม่มีรายจ่าย"
            description="แตะ + เพื่อเพิ่มรายจ่ายแรก"
          />
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/item/expense/new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { margin: 16, marginTop: 8 },
  summaryCard: { marginHorizontal: 16, marginBottom: 8 },
  list: { paddingBottom: 100 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});
