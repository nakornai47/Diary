import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, FAB, useTheme, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Task } from '../../models';
import { useDataStore } from '../../stores/dataStore';
import TaskListItem from '../../components/lists/TaskListItem';
import EmptyState from '../../components/ui/EmptyState';

export default function TasksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { tasks, categories, priorities, updateTask } = useDataStore();
  const [search, setSearch] = useState('');

  const filteredTasks = useMemo(
    () => tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase())),
    [tasks, search]
  );

  function handleToggle(task: Task) {
    updateTask({
      ...task,
      isDone: !task.isDone,
      doneAt: !task.isDone ? Date.now() : null,
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Tasks" />
      </Appbar.Header>
      <Searchbar
        placeholder="ค้นหา tasks"
        onChangeText={setSearch}
        value={search}
        style={styles.search}
      />
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TaskListItem
            task={item}
            category={categories.find((c) => c.id === item.categoryId)}
            priority={priorities.find((p) => p.id === item.priorityId)}
            onPress={() => router.push(`/item/task/${item.id}`)}
            onToggle={() => handleToggle(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="checkbox-marked-circle-outline"
            title="ยังไม่มี tasks"
            description="แตะ + เพื่อเพิ่ม task แรก"
          />
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/item/task/new')}
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
