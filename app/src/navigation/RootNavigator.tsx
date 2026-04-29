import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store';
import LoginScreen from '../screens/LoginScreen';
import LibraryScreen from '../screens/LibraryScreen';
import FolderScreen from '../screens/FolderScreen';
import PlayerScreen from '../screens/PlayerScreen';
import QueueScreen from '../screens/QueueScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminScreen from '../screens/AdminScreen';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Library"
              component={LibraryScreen}
              options={{ title: '音乐库' }}
            />
            <Stack.Screen
              name="Folder"
              component={FolderScreen}
              options={({ route }) => ({ title: route.params.folderName })}
            />
            <Stack.Screen
              name="Player"
              component={PlayerScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="Queue"
              component={QueueScreen}
              options={{ title: '播放队列' }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ title: '搜索' }}
            />
            <Stack.Screen
              name="Favorites"
              component={FavoritesScreen}
              options={{ title: '收藏' }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ title: '最近播放' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: '设置' }}
            />
            <Stack.Screen
              name="Admin"
              component={AdminScreen}
              options={{ title: '管理' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
