/**
 * 动态主题 Hook
 * 让组件能够响应主题变化并自动重渲染
 */
import { useMemo } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { AppTheme } from '../types/settings';
import { colors as lightColors } from './colors';

// 深色主题颜色
const darkColors = {
  ...lightColors,
  // 主色调
  primary: '#FFAB91',
  primaryLight: '#FFCCBC',
  primaryDark: '#FF7043',
  // 辅助色
  secondary: '#03DAC6',
  secondaryLight: '#66FFF9',
  secondaryDark: '#00A896',
  // 背景色
  background: '#121212',
  surface: '#1E1E1E',
  // 文字颜色
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textDisabled: '#666666',
  // 状态颜色
  error: '#CF6679',
  success: '#4CAF50',
  warning: '#FFB74D',
  info: '#64B5F6',
  // 边框
  border: '#333333',
  // 日历相关颜色
  today: '#FF6B6B',
  selected: '#FFAB91',
  disabled: '#444444',
};

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
};

export type AppColors = typeof lightColors;
export type AppThemeType = typeof baseTheme & { colors: AppColors };

/**
 * 获取当前主题的 Hook
 * 当主题设置变化时，组件会自动重新渲染
 */
export const useAppTheme = (): AppThemeType => {
  const themeSetting = useSettingsStore(state => state.settings.theme);

  const theme = useMemo(() => {
    const isDark = themeSetting === AppTheme.DARK;
    // TODO: 处理 SYSTEM 模式（需要使用 Appearance API）
    
    return {
      ...baseTheme,
      colors: isDark ? darkColors : lightColors,
    };
  }, [themeSetting]);

  return theme;
};

/**
 * 仅获取当前主题颜色的 Hook
 */
export const useAppColors = (): AppColors => {
  const themeSetting = useSettingsStore(state => state.settings.theme);

  const colors = useMemo(() => {
    const isDark = themeSetting === AppTheme.DARK;
    return isDark ? darkColors : lightColors;
  }, [themeSetting]);

  return colors;
};
