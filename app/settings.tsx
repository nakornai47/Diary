import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Appbar, List, RadioButton, Button, Divider, Text, useTheme, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAppStore } from '../stores/useAppStore';
import { CURRENCY_OPTIONS, APP_NAME } from '../constants';
import { exportToJson, importFromJson } from '../services/backup';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, setSettings } = useAppStore();
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function updateTheme(themeValue: 'light' | 'dark' | 'system') {
    setSettings({ ...settings, theme: themeValue });
  }

  function updateCurrency(currency: string) {
    setSettings({ ...settings, currency });
  }

  async function handleExport() {
    try {
      await exportToJson();
      setSnackbar({ visible: true, message: 'สำรองข้อมูลสำเร็จ' });
    } catch (e) {
      setSnackbar({ visible: true, message: 'สำรองข้อมูลล้มเหลว' });
    }
  }

  async function handleImportNative() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      await importFromJson(text);
      setSnackbar({ visible: true, message: 'นำเข้าข้อมูลสำเร็จ' });
    } catch (e) {
      setSnackbar({ visible: true, message: 'นำเข้าข้อมูลล้มเหลว' });
    }
  }

  async function handleImportWeb(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importFromJson(text);
    setSnackbar({ visible: true, message: 'นำเข้าข้อมูลสำเร็จ' });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="ตั้งค่า" />
      </Appbar.Header>
      <ScrollView>
        <List.Section>
          <List.Subheader>ธีม</List.Subheader>
          <RadioButton.Group onValueChange={(v) => updateTheme(v as any)} value={settings.theme}>
            <RadioButton.Item label="ตามระบบ" value="system" />
            <RadioButton.Item label="สว่าง" value="light" />
            <RadioButton.Item label="มืด" value="dark" />
          </RadioButton.Group>
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>สกุลเงิน</List.Subheader>
          <RadioButton.Group onValueChange={updateCurrency} value={settings.currency}>
            {CURRENCY_OPTIONS.map((c) => (
              <RadioButton.Item key={c.value} label={c.label} value={c.value} />
            ))}
          </RadioButton.Group>
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>ข้อมูล</List.Subheader>
          <List.Item
            title="สำรองข้อมูล (Export JSON)"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={handleExport}
          />
          <List.Item
            title="นำเข้าข้อมูล (Import JSON)"
            left={(props) => <List.Icon {...props} icon="upload" />}
            onPress={Platform.OS === 'web' ? () => fileInputRef.current?.click() : handleImportNative}
          />
          {Platform.OS === 'web' && (
            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImportWeb}
            />
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>เกี่ยวกับ</List.Subheader>
          <List.Item
            title={APP_NAME}
            description="เวอร์ชัน 1.0.0"
            left={(props) => <List.Icon {...props} icon="information-outline" />}
          />
        </List.Section>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={2000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
