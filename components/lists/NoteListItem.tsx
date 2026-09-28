import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { Note, Category, Priority } from '../../models';
import CategoryChip from '../ui/CategoryChip';

interface Props {
  note: Note;
  category?: Category | null;
  priority?: Priority | null;
  onPress: () => void;
}

export default function NoteListItem({ note, category, priority, onPress }: Props) {
  const theme = useTheme();
  const preview = note.content.replace(/[#*_\-\[\]`]/g, '').slice(0, 80);

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" numberOfLines={1}>
          {note.title || 'ไม่มีชื่อ'}
        </Text>
        {preview.length > 0 && (
          <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {preview}
          </Text>
        )}
        <View style={styles.chips}>
          <CategoryChip category={category} priority={priority} compact />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6 },
  content: { paddingVertical: 12 },
  chips: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
});
