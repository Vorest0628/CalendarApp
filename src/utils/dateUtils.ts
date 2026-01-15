import dayjs from 'dayjs';

/**
 * 获取当前月份的所有日期
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  const date = dayjs(`${year}-${month}-01`);
  const daysInMonth = date.daysInMonth();
  const days: Date[] = [];

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(date.date(i).toDate());
  }

  return days;
}

/**
 * 获取月份的第一天是星期几（0-6，0 表示周日）
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return dayjs(`${year}-${month}-01`).day();
}

/**
 * 格式化日期
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

/**
 * 判断是否为今天
 */
export function isToday(date: Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * 判断是否为同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return dayjs(date1).isSame(dayjs(date2), 'day');
}

/**
 * 获取月份名称
 */
export function getMonthName(month: number): string {
  const months = [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
  ];
  return months[month - 1];
}

/**
 * 获取年月字符串
 */
export function getYearMonthString(year: number, month: number): string {
  return `${year}年${month}月`;
}
