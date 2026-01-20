import { colors } from './colors';
import { AppTheme } from '../types/settings';

// 重新导出 useAppTheme hook
export { useAppTheme, useAppColors } from './useAppTheme';
export type { AppThemeType, AppColors } from './useAppTheme';

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

export const theme = {
  ...baseTheme,
  colors,
};

export type Theme = typeof theme;

export const createAppTheme = (appTheme: AppTheme): Theme => {
  const isDark = appTheme === AppTheme.DARK;

  const themeColors = isDark
    ? {
        ...colors,
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
      }
    : colors;

  return {
    ...baseTheme,
    colors: themeColors,
  };
};
