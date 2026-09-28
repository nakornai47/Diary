import React, { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { lightTheme, darkTheme } from '../../theme';
import { useAppStore } from '../../stores/useAppStore';
import { useDataStore } from '../../stores/dataStore';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const { settings, loadSettings, setIsReady } = useAppStore();
  const { loadAll, seedDefaults } = useDataStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' && colorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function init() {
      await loadSettings();
      await loadAll();
      await seedDefaults();
      setIsReady(true);
      setIsInitialized(true);
    }
    init();
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {children}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
