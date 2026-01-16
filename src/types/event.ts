/**
 * 日程事件类型定义
 */
export interface Event {
  id: string; // 唯一标识符
  title: string; // 标题
  description?: string; // 描述（可选）
  location?: string; // 地点（可选）
  startTime: Date; // 开始时间
  endTime: Date; // 结束时间
  isAllDay: boolean; // 是否全天事件
  color: string; // 颜色标签（如 '#FF5733'）
  calendarId?: string; // 所属日历 ID
  rrule?: string; // 重复规则（RFC 5545 格式）
  isLunar?: boolean; // 是否农历日程
  parentEventId?: string; // 重复日程的父 ID
  exceptionDates?: string[]; // 排除日期
  reminder?: number; // 提前提醒时间（分钟）
  reminders?: Reminder[]; // 关联的提醒列表
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

/**
 * 日历视图类型
 */
export type CalendarView = 'month' | 'week' | 'day';

/**
 * 日期对象类型
 */
export interface DateObject {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  timestamp: number;
  dateString: string; // 'YYYY-MM-DD'
}

/**
 * 提醒对象
 */
export interface Reminder {
  id: string; // 提醒 ID
  eventId: string; // 关联的日程 ID
  triggerTime: Date; // 触发时间
  method: ReminderMethod; // 提醒方式
  status: ReminderStatus; // 提醒状态
  notificationId?: string; // 系统通知 ID
}

/**
 * 提醒方式枚举
 */
export enum ReminderMethod {
  NOTIFICATION = 'notification', // 系统通知
  ALERT = 'alert', // 应用内弹窗
  VIBRATE = 'vibrate', // 震动
}

/**
 * 提醒状态枚举
 */
export enum ReminderStatus {
  PENDING = 'pending', // 待触发
  SENT = 'sent', // 已发送
  DISMISSED = 'dismissed', // 已忽略
  SNOOZED = 'snoozed', // 已延后
}

/**
 * 预设提醒选项
 */
export const REMINDER_PRESETS = [
  { label: '事件发生时', value: 0 },
  { label: '提前 5 分钟', value: 5 },
  { label: '提前 10 分钟', value: 10 },
  { label: '提前 15 分钟', value: 15 },
  { label: '提前 30 分钟', value: 30 },
  { label: '提前 1 小时', value: 60 },
  { label: '提前 2 小时', value: 120 },
  { label: '提前 1 天', value: 1440 },
];
