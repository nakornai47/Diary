import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, FAB, useTheme, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDataStore } from '../../stores/dataStore';
import NoteListItem from '../../components/lists/NoteListItem';
import EmptyState from '../../components/ui/EmptyState';

export default function NotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { notes, categories, priorities } = useDataStore();
  const [search, setSearch] = useState('');

  const filteredNotes = useMemo(
    () =>
      notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      ),
    [notes, search]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Notes" />
      </Appbar.Header>
      <Searchbar
        placeholder="ค้นหา notes"
        onChangeText={setSearch}
        value={search}
        style={styles.search}
      />
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NoteListItem
            note={item}
            category={categories.find((c) => c.id === item.categoryId)}
            priority={priorities.find((p) => p.id === item.priorityId)}
            onPress={() => router.push(`/item/note/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="note-text-outline"
            title="ยังไม่มี notes"
            description="แตะ + เพื่อเพิ่ม note แรก"
          />
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/item/note/new')}
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
