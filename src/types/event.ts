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
