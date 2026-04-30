import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './navigation/RootNavigator';
import { useAuthStore, useSettingsStore } from './store';
import { getColors } from './theme/colors';

export default function App() {
  const { loadFromStorage: loadAuth } = useAuthStore();
  const { loadFromStorage: loadSettings, theme } = useSettingsStore();
  const colors = getColors(theme);

  useEffect(() => {
    loadAuth();
    loadSettings();
  }, []);

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={colors.statusBarStyle}
      />
      <RootNavigator />
    </>
  );
}
