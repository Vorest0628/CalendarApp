import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, AppTheme, WeekStart } from '../types/settings';
import DatabaseService from '../database/DatabaseService';
import NotificationService from '../services/NotificationService';
import { useEventStore } from './eventStore';

const APP_SETTINGS_KEY = 'calendar_app_settings';

const defaultSettings: AppSettings = {
  theme: AppTheme.LIGHT,
  defaultReminderMinutes: [15],
  weekStart: WeekStart.MONDAY,
  notificationsEnabled: true,
  showLunar: true, // 默认显示农历
  showSolarTerms: true, // 默认显示节气
  showTraditionalFestivals: true, // 默认显示传统节日
};

interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  loadSettings: () => Promise<void>;
  setTheme: (theme: AppTheme) => Promise<void>;
  setDefaultReminderMinutes: (minutes: number[]) => Promise<void>;
  setWeekStart: (weekStart: WeekStart) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setShowLunar: (show: boolean) => Promise<void>;
  setShowSolarTerms: (show: boolean) => Promise<void>;
  setShowTraditionalFestivals: (show: boolean) => Promise<void>;
  clearCache: () => Promise<void>;
  resetApp: (options?: { clearEvents?: boolean }) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const saveSettings = async (updates: Partial<AppSettings>) => {
    const current = get().settings;
    const next: AppSettings = {
      ...current,
      ...updates,
    };

    set({ settings: next });

    try {
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  };

  return {
    settings: defaultSettings,
    loading: true,

    loadSettings: async () => {
      try {
        const stored = await AsyncStorage.getItem(APP_SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<AppSettings>;

          // 兼容旧版本：defaultReminderMinutes 可能是 number，需要转成 number[]
          let normalized: Partial<AppSettings> = { ...parsed };
          const anyParsed = parsed as any;
          if (anyParsed.defaultReminderMinutes !== undefined) {
            if (Array.isArray(anyParsed.defaultReminderMinutes)) {
              normalized.defaultReminderMinutes = anyParsed.defaultReminderMinutes;
            } else if (typeof anyParsed.defaultReminderMinutes === 'number') {
              normalized.defaultReminderMinutes = [anyParsed.defaultReminderMinutes];
            }
          }

          const merged: AppSettings = {
            ...defaultSettings,
            ...normalized,
          };
          set({ settings: merged, loading: false });
        } else {
          set({ settings: defaultSettings, loading: false });
        }
      } catch (error) {
        console.error('Failed to load app settings:', error);
        set({ settings: defaultSettings, loading: false });
      }
    },

    setTheme: async (theme: AppTheme) => {
      await saveSettings({ theme });
    },

    setDefaultReminderMinutes: async (minutes: number[]) => {
      await saveSettings({ defaultReminderMinutes: minutes });
    },

    setWeekStart: async (weekStart: WeekStart) => {
      await saveSettings({ weekStart });
    },

    setNotificationsEnabled: async (enabled: boolean) => {
      await saveSettings({ notificationsEnabled: enabled });
    },

    setShowLunar: async (show: boolean) => {
      await saveSettings({ showLunar: show });
    },

    setShowSolarTerms: async (show: boolean) => {
      await saveSettings({ showSolarTerms: show });
    },

    setShowTraditionalFestivals: async (show: boolean) => {
      await saveSettings({ showTraditionalFestivals: show });
    },

    clearCache: async () => {
      try {
        await AsyncStorage.removeItem(APP_SETTINGS_KEY);
      } catch (error) {
        console.error('Failed to clear app settings cache:', error);
      }
      set({ settings: defaultSettings });
    },

    resetApp: async (_options?: { clearEvents?: boolean }) => {
      // 重置应用：清除设置、数据库数据、已调度的通知
      try {
        // 1. 清除所有已调度的通知
        await NotificationService.cancelAllNotifications();
        console.log('All notifications cancelled');
      } catch (error) {
        console.error('Failed to cancel notifications:', error);
      }

      try {
        // 2. 清空数据库数据（日程、提醒）
        await DatabaseService.clearAllData();
        // 同时清空内存中的日程数据
        useEventStore.getState().clearEvents();
        console.log('Database data cleared');
      } catch (error) {
        console.error('Failed to clear database data:', error);
      }

      try {
        // 3. 清除应用设置缓存
        await AsyncStorage.removeItem(APP_SETTINGS_KEY);
      } catch (error) {
        console.error('Failed to reset app settings:', error);
      }

      // 4. 恢复默认设置
      set({ settings: defaultSettings });
    },
  };
});
