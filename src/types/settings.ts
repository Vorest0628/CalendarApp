/**
 * 应用设置类型定义
 */

export enum AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * 周起始日枚举
 */
export enum WeekStart {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
}

/**
 * 应用设置对象
 */
export interface AppSettings {
  theme: AppTheme; // 主题模式（浅色/深色/跟随系统）
  defaultReminderMinutes: number[]; // 默认提醒时间列表（分钟），可为空
  weekStart: WeekStart; // 周起始日
  notificationsEnabled: boolean; // 是否启用通知（总开关）

  showLunar: boolean; // 是否显示农历日期
  showSolarTerms: boolean; // 是否显示节气
  showTraditionalFestivals: boolean; // 是否显示传统节日
}
