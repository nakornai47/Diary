import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, FAB, useTheme, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Habit } from '../../models';
import { useDataStore } from '../../stores/dataStore';
import HabitListItem, { isCompletedToday } from '../../components/lists/HabitListItem';
import EmptyState from '../../components/ui/EmptyState';

export default function HabitsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { habits, categories, priorities, updateHabit } = useDataStore();
  const [search, setSearch] = useState('');

  const filteredHabits = useMemo(
    () => habits.filter((h) => h.title.toLowerCase().includes(search.toLowerCase())),
    [habits, search]
  );

  function handleComplete(habit: Habit) {
    const today = new Date().setHours(0, 0, 0, 0);
    let completions = [...habit.completions];

    if (isCompletedToday(habit)) {
      completions = completions.filter((ts) => new Date(ts).setHours(0, 0, 0, 0) !== today);
    } else {
      completions.push(Date.now());
    }

    updateHabit({ ...habit, completions });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Habits" />
      </Appbar.Header>
      <Searchbar
        placeholder="ค้นหา habits"
        onChangeText={setSearch}
        value={search}
        style={styles.search}
      />
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <HabitListItem
            habit={item}
            category={categories.find((c) => c.id === item.categoryId)}
            priority={priorities.find((p) => p.id === item.priorityId)}
            onPress={() => router.push(`/item/habit/${item.id}`)}
            onComplete={() => handleComplete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="repeat"
            title="ยังไม่มี habits"
            description="แตะ + เพื่อเพิ่ม habit แรกของคุณ"
          />
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/item/habit/new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { margin: 16, marginTop: 8 },
  list: { paddingBottom: 100 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});
