import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Menu,
  Text,
  useTheme,
  IconButton,
  Divider,
  Chip,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ItemType, Habit, Task, Note, Expense, ChecklistItem } from '../../models';
import { useDataStore } from '../../stores/dataStore';
import { CURRENCY_OPTIONS } from '../../constants';

interface Props {
  type: ItemType;
  item?: Partial<Habit & Task & Note & Expense>;
  onSave: (data: any) => void;
  onDelete?: () => void;
}

export default function ItemForm({ type, item, onSave, onDelete }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { categories, priorities } = useDataStore();

  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState((item as Note)?.content || '');
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId || null);
  const [priorityId, setPriorityId] = useState<string | null>(item?.priorityId || null);
  const [intervalDays, setIntervalDays] = useState(String((item as Habit)?.intervalDays || 1));
  const [amount, setAmount] = useState(String((item as Expense)?.amount || ''));
  const [date, setDate] = useState(new Date((item as Expense)?.date || (item as Task)?.dueDate || Date.now()));
  const [hasDueDate, setHasDueDate] = useState(Boolean((item as Task)?.dueDate));
  const [checklist, setChecklist] = useState<ChecklistItem[]>((item as Task)?.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState('');

  const [catMenuVisible, setCatMenuVisible] = useState(false);
  const [prioMenuVisible, setPrioMenuVisible] = useState(false);

  const isEdit = Boolean(item?.id);

  function handleSave() {
    const base = {
      title: title.trim() || (type === 'expense' ? 'รายจ่าย' : 'ไม่มีชื่อ'),
      categoryId,
      priorityId: type === 'expense' ? null : priorityId,
    };

    switch (type) {
      case 'habit':
        onSave({ ...base, intervalDays: parseInt(intervalDays, 10) || 1 });
        break;
      case 'task':
        onSave({
          ...base,
          text: content,
          dueDate: hasDueDate ? date.getTime() : null,
          checklist,
        });
        break;
      case 'note':
        onSave({ ...base, content });
        break;
      case 'expense':
        onSave({ ...base, amount: parseFloat(amount) || 0, date: date.getTime() });
        break;
    }
  }

  function addCheckItem() {
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { id: Date.now().toString(), title: newCheckItem.trim(), isDone: false }]);
    setNewCheckItem('');
  }

  function toggleCheckItem(id: string) {
    setChecklist(checklist.map((i) => (i.id === id ? { ...i, isDone: !i.isDone } : i)));
  }

  function removeCheckItem(id: string) {
    setChecklist(checklist.filter((i) => i.id !== id));
  }

  return (
    <ScrollView style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <TextInput
        label={type === 'expense' ? 'รายละเอียด' : 'ชื่อ'}
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />

      {(type === 'note' || type === 'task') && (
        <TextInput
          label={type === 'note' ? 'เนื้อหา (Markdown)' : 'รายละเอียด'}
          value={content}
          onChangeText={setContent}
          mode="outlined"
          multiline
          numberOfLines={type === 'note' ? 6 : 3}
          style={styles.input}
        />
      )}

      {type === 'habit' && (
        <TextInput
          label="ทำซ้ำทุกกี่วัน"
          value={intervalDays}
          onChangeText={setIntervalDays}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />
      )}

      {type === 'expense' && (
        <TextInput
          label="จำนวนเงิน"
          value={amount}
          onChangeText={setAmount}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
        />
      )}

      {(type === 'task' || type === 'expense') && (
        <View style={styles.row}>
          {type === 'task' && (
            <SegmentedButtons
              value={hasDueDate ? 'due' : 'none'}
              onValueChange={(v) => setHasDueDate(v === 'due')}
              buttons={[
                { value: 'none', label: 'ไม่กำหนด' },
                { value: 'due', label: 'กำหนดวัน' },
              ]}
              style={styles.segmented}
            />
          )}
          {(type === 'expense' || hasDueDate) && (
            <View style={styles.datePicker}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {type === 'expense' ? 'วันที่' : 'ครบกำหนด'}
              </Text>
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => selectedDate && setDate(selectedDate)}
              />
            </View>
          )}
        </View>
      )}

      <Menu
        visible={catMenuVisible}
        onDismiss={() => setCatMenuVisible(false)}
        anchor={
          <TextInput
            label="หมวดหมู่"
            value={categories.find((c) => c.id === categoryId)?.name || 'ไม่มีหมวดหมู่'}
            mode="outlined"
            style={styles.input}
            editable={false}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setCatMenuVisible(true)} />}
            onPressIn={() => setCatMenuVisible(true)}
          />
        }
      >
        <Menu.Item onPress={() => { setCategoryId(null); setCatMenuVisible(false); }} title="ไม่มีหมวดหมู่" />
        {categories.map((c) => (
          <Menu.Item
            key={c.id}
            onPress={() => { setCategoryId(c.id); setCatMenuVisible(false); }}
            title={c.name}
            leadingIcon={c.icon as any}
          />
        ))}
      </Menu>

      {type !== 'expense' && (
        <Menu
          visible={prioMenuVisible}
          onDismiss={() => setPrioMenuVisible(false)}
          anchor={
            <TextInput
              label="ความสำคัญ"
              value={priorities.find((p) => p.id === priorityId)?.name || 'ไม่มี'}
              mode="outlined"
              style={styles.input}
              editable={false}
              right={<TextInput.Icon icon="chevron-down" onPress={() => setPrioMenuVisible(true)} />}
              onPressIn={() => setPrioMenuVisible(true)}
            />
          }
        >
          <Menu.Item onPress={() => { setPriorityId(null); setPrioMenuVisible(false); }} title="ไม่มี" />
          {priorities.map((p) => (
            <Menu.Item
              key={p.id}
              onPress={() => { setPriorityId(p.id); setPrioMenuVisible(false); }}
              title={p.name}
            />
          ))}
        </Menu>
      )}

      {type === 'task' && (
        <View style={styles.checklistSection}>
          <Text variant="titleSmall">Checklist</Text>
          {checklist.map((item) => (
            <Chip
              key={item.id}
              icon={item.isDone ? 'check-circle' : 'checkbox-blank-circle-outline'}
              onPress={() => toggleCheckItem(item.id)}
              onClose={() => removeCheckItem(item.id)}
              style={styles.checkItem}
            >
              {item.title}
            </Chip>
          ))}
          <View style={styles.checkInputRow}>
            <TextInput
              label="เพิ่มรายการ"
              value={newCheckItem}
              onChangeText={setNewCheckItem}
              mode="outlined"
              style={{ flex: 1 }}
              onSubmitEditing={addCheckItem}
            />
            <IconButton icon="plus" mode="contained" onPress={addCheckItem} />
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button mode="contained" onPress={handleSave} style={styles.button}>
          {isEdit ? 'บันทึก' : 'สร้าง'}
        </Button>
        {isEdit && onDelete && (
          <Button mode="outlined" textColor={theme.colors.error} onPress={onDelete} style={styles.button}>
            ลบ
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { marginBottom: 12 },
  row: { marginBottom: 12 },
  segmented: { marginBottom: 12 },
  datePicker: { marginBottom: 12 },
  checklistSection: { marginVertical: 12 },
  checkItem: { marginVertical: 4, alignSelf: 'flex-start' },
  checkInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  actions: { marginTop: 24, gap: 12 },
  button: { marginVertical: 6 },
});
