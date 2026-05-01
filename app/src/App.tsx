import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './navigation/RootNavigator';
import { useAuthStore, useSettingsStore } from './store';

export default function App() {
  const { loadFromStorage: loadAuth } = useAuthStore();
  const { loadFromStorage: loadSettings, theme } = useSettingsStore();

  useEffect(() => {
    loadAuth();
    loadSettings();
  }, []);

  return (
    <>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <RootNavigator />
    </>
  );
}
