import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, useTheme, IconButton } from 'react-native-paper';
import * as Crypto from 'expo-crypto';
import { useAppStore } from '../../stores/useAppStore';
import { getItem, STORAGE_KEYS } from '../../db';
import { PIN_LENGTH, PIN_HASH_SALT } from '../../constants';

export default function PinLock() {
  const theme = useTheme();
  const { setIsAuthenticated } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      verifyPin(pin);
    }
  }, [pin]);

  async function verifyPin(input: string) {
    try {
      const storedHash = await getItem<string>(STORAGE_KEYS.pinHash, '');

      // Safety: if PIN is enabled but hash is missing, avoid permanent lockout
      if (!storedHash) {
        setIsAuthenticated(true);
        return;
      }

      const inputHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        PIN_HASH_SALT + input
      );

      if (inputHash === storedHash) {
        setIsAuthenticated(true);
      } else {
        setPin('');
        setError('PIN ไม่ถูกต้อง');
      }
    } catch (e) {
      setPin('');
      setError('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    }
  }

  function handlePress(digit: string) {
    if (pin.length < PIN_LENGTH) {
      setPin((prev) => prev + digit);
      setError('');
    }
  }

  function handleBackspace() {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }

  function handleClear() {
    setPin('');
    setError('');
  }

  const renderDot = (index: number) => {
    const filled = index < pin.length;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            borderColor: theme.colors.primary,
            backgroundColor: filled ? theme.colors.primary : 'transparent',
          },
        ]}
      />
    );
  };

  const renderKey = (digit: string) => (
    <Pressable
      key={digit}
      onPress={() => handlePress(digit)}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface },
      ]}
    >
      <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
        {digit}
      </Text>
    </Pressable>
  );

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <IconButton icon="lock-outline" size={48} iconColor={theme.colors.primary} />
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
          ใส่ PIN เพื่อเปิดแอป
        </Text>

        <View style={styles.dotsContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => renderDot(i))}
        </View>

        {error ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error, marginTop: 8 }}>
            {error}
          </Text>
        ) : null}

        <View style={styles.keypad}>
          <View style={styles.row}>{['1', '2', '3'].map(renderKey)}</View>
          <View style={styles.row}>{['4', '5', '6'].map(renderKey)}</View>
          <View style={styles.row}>{['7', '8', '9'].map(renderKey)}</View>
          <View style={styles.row}>
            <View style={[styles.key, { backgroundColor: 'transparent' }]} />
            {renderKey('0')}
            <Pressable
              onPress={handleBackspace}
              onLongPress={handleClear}
              style={({ pressed }) => [
                styles.key,
                { backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface },
              ]}
            >
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
                ⌫
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 16,
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    marginTop: 32,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
