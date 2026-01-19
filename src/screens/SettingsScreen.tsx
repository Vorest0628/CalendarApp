import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import { REMINDER_PRESETS } from '../types/event';
import { useSettingsStore } from '../store/settingsStore';
import { AppTheme, WeekStart } from '../types/settings';

const SettingsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const settings = useSettingsStore(state => state.settings);
  const setTheme = useSettingsStore(state => state.setTheme);
  const setDefaultReminderMinutes = useSettingsStore(
    state => state.setDefaultReminderMinutes,
  );
  const setWeekStart = useSettingsStore(state => state.setWeekStart);
  const setNotificationsEnabled = useSettingsStore(
    state => state.setNotificationsEnabled,
  );
  const clearCache = useSettingsStore(state => state.clearCache);
  const resetApp = useSettingsStore(state => state.resetApp);

  const formatDefaultReminder = () => {
    const minutesList = Array.isArray(settings.defaultReminderMinutes)
      ? settings.defaultReminderMinutes
      : [];
    if (!minutesList.length) {
      return '未设置（默认不添加提醒）';
    }

    const labels = REMINDER_PRESETS.filter(item =>
      minutesList.includes(item.value),
    ).map(item => item.label);

    return labels.join('、');
  };

  const handleClearCache = () => {
    Alert.alert('清除缓存', '将清除应用设置缓存，但不会删除日程数据。确定继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => {
          clearCache();
        },
      },
    ]);
  };

  const handleResetApp = () => {
    Alert.alert(
      '重置应用',
      '将清除所有日程、提醒和设置，恢复到初始状态。\n\n此操作不可撤销，确定继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定重置',
          style: 'destructive',
          onPress: () => {
            resetApp();
          },
        },
      ]
    );
  };

  const handleToggleDefaultReminder = (value: number) => {
    const current = Array.isArray(settings.defaultReminderMinutes)
      ? settings.defaultReminderMinutes
      : [];
    const exists = current.includes(value);
    const next = exists
      ? current.filter(v => v !== value)
      : [...current, value].sort((a, b) => a - b);

    setDefaultReminderMinutes(next);
  };

  const renderThemeOption = (value: AppTheme, label: string) => {
    const active = settings.theme === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setTheme(value)}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderWeekStartOption = (value: WeekStart, label: string) => {
    const active = settings.weekStart === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setWeekStart(value)}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 主题与外观 */}
      <Text style={styles.sectionTitle}>主题与外观</Text>
      <View style={styles.sectionBox}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>主题模式</Text>
        </View>
        <View style={styles.chipRow}>
          {renderThemeOption(AppTheme.LIGHT, '浅色')}
          {renderThemeOption(AppTheme.DARK, '深色')}
          {renderThemeOption(AppTheme.SYSTEM, '跟随系统')}
        </View>
      </View>

      {/* 日程与提醒 */}
      <Text style={styles.sectionTitle}>日程与提醒</Text>
      <View style={styles.sectionBox}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>通知总开关</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.label}>默认提醒时间</Text>
            <Text style={styles.subLabel}>{formatDefaultReminder()}</Text>
          </View>
        </View>
        <View style={styles.chipRow}>
          {REMINDER_PRESETS.map(item => {
            const minutesList = Array.isArray(settings.defaultReminderMinutes)
              ? settings.defaultReminderMinutes
              : [];
            const active = minutesList.includes(item.value);
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleToggleDefaultReminder(item.value)}>
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 日历显示 */}
      <Text style={styles.sectionTitle}>日历显示</Text>
      <View style={styles.sectionBox}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>周起始日</Text>
        </View>
        <View style={styles.chipRow}>
          {renderWeekStartOption(WeekStart.SUNDAY, '周日')} 
          {renderWeekStartOption(WeekStart.MONDAY, '周一')}
        </View>
      </View>

      {/* 数据管理 */}
      <Text style={styles.sectionTitle}>数据管理</Text>
      <View style={styles.sectionBox}>
        <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
          <Text style={styles.actionText}>清除缓存</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleResetApp}>
          <Text style={[styles.actionText, styles.dangerText]}>重置应用</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    sectionTitle: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    sectionBox: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    subLabel: {
      marginTop: 4,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 8,
      marginBottom: 8,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.text,
    },
    chipTextActive: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    actionRow: {
      paddingVertical: 10,
    },
    actionText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    dangerText: {
      color: theme.colors.error,
    },
  });
