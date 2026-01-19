import dayjs from 'dayjs';
import { getDaysInMonth, getFirstDayOfMonth } from './dateUtils';
import { WeekStart } from '../types/settings';

/**
 * 月视图数据结构
 */
export interface MonthData {
  year: number;
  month: number;
  daysInMonth: Date[];
  firstDayOfWeek: number; // 考虑周起始日后的偏移量
}

/**
 * 周视图数据结构
 */
export interface WeekData {
  weekStart: Date;
  weekDays: Date[];
}

/**
 * 日视图数据结构
 */
export interface DayData {
  date: Date;
}

/**
 * 懒加载数据容器（包含前、中、后三个周期）
 */
export interface LazyLoadData<T> {
  prev: T;
  current: T;
  next: T;
}

/**
 * 计算月视图的懒加载数据（前一月、当前月、后一月）
 * @param year 当前年份
 * @param month 当前月份（1-12）
 * @param weekStartSetting 周起始日设置
 * @returns 包含三个月数据的对象
 */
export function getMonthLazyLoadData(
  year: number,
  month: number,
  weekStartSetting: WeekStart = WeekStart.SUNDAY,
): LazyLoadData<MonthData> {
  // 计算前一月
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  // 计算后一月
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const calculateOffset = (y: number, m: number) => {
    const firstDay = getFirstDayOfMonth(y, m); // 0-6 (Sun-Sat)
    if (weekStartSetting === WeekStart.MONDAY) {
      // 如果周一开头：一(0) 二(1) ... 日(6)
      // 原始：日(0) 一(1) 二(2) ... 六(6)
      // 转换：日(0)->6, 一(1)->0, 二(2)->1 ... 六(6)->5
      return (firstDay + 6) % 7;
    }
    return firstDay;
  };

  return {
    prev: {
      year: prevYear,
      month: prevMonth,
      daysInMonth: getDaysInMonth(prevYear, prevMonth),
      firstDayOfWeek: calculateOffset(prevYear, prevMonth),
    },
    current: {
      year,
      month,
      daysInMonth: getDaysInMonth(year, month),
      firstDayOfWeek: calculateOffset(year, month),
    },
    next: {
      year: nextYear,
      month: nextMonth,
      daysInMonth: getDaysInMonth(nextYear, nextMonth),
      firstDayOfWeek: calculateOffset(nextYear, nextMonth),
    },
  };
}

/**
 * 计算周视图的懒加载数据（前一周、当前周、后一周）
 * @param weekStart 当前周的起始日期
 * @returns 包含三周数据的对象
 */
export function getWeekLazyLoadData(weekStart: Date): LazyLoadData<WeekData> {
  const getWeekDays = (start: Date): Date[] => {
    return Array.from({ length: 7 }, (_, i) =>
      dayjs(start).add(i, 'day').toDate()
    );
  };

  const prevWeekStart = dayjs(weekStart).subtract(7, 'day').toDate();
  const nextWeekStart = dayjs(weekStart).add(7, 'day').toDate();

  return {
    prev: {
      weekStart: prevWeekStart,
      weekDays: getWeekDays(prevWeekStart),
    },
    current: {
      weekStart,
      weekDays: getWeekDays(weekStart),
    },
    next: {
      weekStart: nextWeekStart,
      weekDays: getWeekDays(nextWeekStart),
    },
  };
}

/**
 * 计算日视图的懒加载数据（前一天、当天、后一天）
 * @param date 当前日期
 * @returns 包含三天数据的对象
 */
export function getDayLazyLoadData(date: Date): LazyLoadData<DayData> {
  return {
    prev: {
      date: dayjs(date).subtract(1, 'day').toDate(),
    },
    current: {
      date,
    },
    next: {
      date: dayjs(date).add(1, 'day').toDate(),
    },
  };
}
