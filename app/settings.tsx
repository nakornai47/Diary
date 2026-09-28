import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Appbar,
  List,
  RadioButton,
  Button,
  Divider,
  Text,
  useTheme,
  Snackbar,
  Switch,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useAppStore } from '../stores/useAppStore';
import { CURRENCY_OPTIONS, APP_NAME, PIN_LENGTH, PIN_HASH_SALT } from '../constants';
import { exportToJson, importFromJson } from '../services/backup';
import { getItem, setItem, removeItem, STORAGE_KEYS } from '../db';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, setSettings, setIsAuthenticated } = useAppStore();
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pinDialog, setPinDialog] = useState({
    visible: false,
    mode: 'enable' as 'enable' | 'disable',
    step: 'enter' as 'enter' | 'confirm' | 'verify',
    pin: '',
    confirmPin: '',
    error: '',
  });

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

  async function hashPin(pin: string) {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      PIN_HASH_SALT + pin
    );
  }

  function openPinDialog(mode: 'enable' | 'disable') {
    setPinDialog({
      visible: true,
      mode,
      step: mode === 'enable' ? 'enter' : 'verify',
      pin: '',
      confirmPin: '',
      error: '',
    });
  }

  function closePinDialog() {
    setPinDialog({
      visible: false,
      mode: 'enable',
      step: 'enter',
      pin: '',
      confirmPin: '',
      error: '',
    });
  }

  async function handlePinSubmit() {
    const { mode, step, pin, confirmPin } = pinDialog;

    if (step === 'confirm') {
      if (confirmPin.length !== PIN_LENGTH) return;
    } else {
      if (pin.length !== PIN_LENGTH) return;
    }

    if (mode === 'enable') {
      if (step === 'enter') {
        setPinDialog({ ...pinDialog, step: 'confirm', confirmPin: '', error: '' });
        return;
      }

      if (pin !== confirmPin) {
        setPinDialog({
          ...pinDialog,
          step: 'enter',
          pin: '',
          confirmPin: '',
          error: 'PIN ไม่ตรงกัน กรุณาลองใหม่',
        });
        return;
      }

      const hash = await hashPin(pin);
      await setItem(STORAGE_KEYS.pinHash, hash);
      setSettings({ ...settings, pinEnabled: true });
      closePinDialog();
      setSnackbar({ visible: true, message: 'เปิดใช้งาน PIN แล้ว' });
    } else {
      const storedHash = await getItem<string>(STORAGE_KEYS.pinHash, '');
      const inputHash = await hashPin(pin);
      if (inputHash !== storedHash) {
        setPinDialog({ ...pinDialog, pin: '', error: 'PIN ไม่ถูกต้อง' });
        return;
      }
      await removeItem(STORAGE_KEYS.pinHash);
      setSettings({ ...settings, pinEnabled: false });
      setIsAuthenticated(true);
      closePinDialog();
      setSnackbar({ visible: true, message: 'ปิดใช้งาน PIN แล้ว' });
    }
  }

  function handlePinInputChange(text: string) {
    const numeric = text.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
    if (pinDialog.step === 'confirm') {
      setPinDialog({ ...pinDialog, confirmPin: numeric, error: '' });
    } else {
      setPinDialog({ ...pinDialog, pin: numeric, error: '' });
    }
  }

  const dialogTitle =
    pinDialog.mode === 'enable'
      ? pinDialog.step === 'enter'
        ? 'ตั้ง PIN 6 หลัก'
        : 'ยืนยัน PIN'
      : 'ปิดการป้องกันด้วย PIN';

  const inputValue = pinDialog.step === 'confirm' ? pinDialog.confirmPin : pinDialog.pin;
  const inputLabel = pinDialog.step === 'confirm' ? 'ยืนยัน PIN' : 'PIN 6 หลัก';
  const submitDisabled = inputValue.length !== PIN_LENGTH;
  const submitLabel =
    pinDialog.mode === 'enable' && pinDialog.step === 'enter' ? 'ถัดไป' : 'ยืนยัน';

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
          <List.Subheader>ความปลอดภัย</List.Subheader>
          <List.Item
            title="ป้องกันด้วย PIN"
            description={settings.pinEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            left={(props) => <List.Icon {...props} icon="lock-outline" />}
            right={() => (
              <Switch
                value={settings.pinEnabled}
                onValueChange={(value) => openPinDialog(value ? 'enable' : 'disable')}
              />
            )}
          />
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

      <Portal>
        <Dialog visible={pinDialog.visible} onDismiss={closePinDialog}>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={inputLabel}
              value={inputValue}
              onChangeText={handlePinInputChange}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={PIN_LENGTH}
              mode="outlined"
              autoFocus
            />
            {pinDialog.error ? (
              <Text style={{ color: theme.colors.error, marginTop: 8 }}>
                {pinDialog.error}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closePinDialog}>ยกเลิก</Button>
            <Button onPress={handlePinSubmit} disabled={submitDisabled}>
              {submitLabel}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
