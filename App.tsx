/**
 * Calendar App
 * React Native 日历应用
 */

import React, { useEffect, useState, useMemo } from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppTheme } from './src/theme/useAppTheme';
import DatabaseService from './src/database/DatabaseService';
import NotificationService from './src/services/NotificationService';
import { useSettingsStore } from './src/store/settingsStore';
import { AppTheme } from './src/types/settings';

function App(): React.JSX.Element {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const appThemeSetting = useSettingsStore(state => state.settings.theme);
  
  // 使用动态主题 Hook
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('Initializing database...');
        await DatabaseService.init();
        console.log('Database initialized successfully');
        
        // 初始化通知服务（创建通知渠道等）
        console.log('Initializing notification service...');
        await NotificationService.checkPermission();
        console.log('Notification service initialized');
        
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initDatabase();
  }, []);

  if (dbError) {
    return (
      <SafeAreaProvider>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>数据库初始化失败</Text>
          <Text style={styles.errorDetail}>{dbError}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isDbReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>初始化中...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={appThemeSetting === AppTheme.DARK ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.text,
    },
    errorText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.error,
      marginBottom: 8,
    },
    errorDetail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
  });

export default App;
