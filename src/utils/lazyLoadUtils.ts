import { useRef, useCallback } from 'react';
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

/**
 * 月视图预加载 Hook
 * 实现动画与数据加载并发，在动画开始时预加载数据
 * @param weekStart 周起始日设置
 */
export function useMonthPreload(weekStart: WeekStart) {
  // 缓存 Map: key 为 "year-month"
  const cacheRef = useRef<Map<string, LazyLoadData<MonthData>>>(new Map());
  // 正在预加载的月份 Set
  const preloadingRef = useRef<Set<string>>(new Set());

  /**
   * 获取缓存 key
   */
  const getCacheKey = useCallback((year: number, month: number): string => {
    return `${year}-${month}`;
  }, []);

  /**
   * 从缓存获取或计算懒加载数据
   * @returns 懒加载数据（优先从缓存读取）
   */
  const getLazyLoadData = useCallback((year: number, month: number): LazyLoadData<MonthData> => {
    const key = getCacheKey(year, month);
    if (cacheRef.current.has(key)) {
      console.log('[Preload] Cache HIT for:', key);
      return cacheRef.current.get(key)!;
    }
    console.log('[Preload] Cache MISS for:', key, '- calculating...');
    const data = getMonthLazyLoadData(year, month, weekStart);
    cacheRef.current.set(key, data);
    return data;
  }, [weekStart, getCacheKey]);

  /**
   * 预加载指定月份的数据（异步，不阻塞动画）
   * 在动画开始时调用，利用动画时间预先计算
   */
  const preloadMonth = useCallback((year: number, month: number) => {
    const key = getCacheKey(year, month);
    if (cacheRef.current.has(key) || preloadingRef.current.has(key)) {
      return; // 已缓存或正在预加载
    }

    preloadingRef.current.add(key);
    console.log('[Preload] Starting preload for:', key);

    // 使用 requestAnimationFrame 异步计算，不阻塞动画
    requestAnimationFrame(() => {
      if (!cacheRef.current.has(key)) {
        const data = getMonthLazyLoadData(year, month, weekStart);
        cacheRef.current.set(key, data);
        console.log('[Preload] Completed preload for:', key);
      }
      preloadingRef.current.delete(key);

      // 同时预加载该月的前后月（扩展缓存深度）
      preloadAdjacentMonths(year, month);
    });
  }, [weekStart, getCacheKey]);

  /**
   * 预加载相邻月份（前后各1个月）
   */
  const preloadAdjacentMonths = useCallback((year: number, month: number) => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    // 异步预加载，不阻塞当前渲染
    setTimeout(() => {
      const prevKey = getCacheKey(prevYear, prevMonth);
      const nextKey = getCacheKey(nextYear, nextMonth);

      if (!cacheRef.current.has(prevKey)) {
        console.log('[Preload] Preloading adjacent (prev):', prevKey);
        cacheRef.current.set(
          prevKey,
          getMonthLazyLoadData(prevYear, prevMonth, weekStart)
        );
      }
      if (!cacheRef.current.has(nextKey)) {
        console.log('[Preload] Preloading adjacent (next):', nextKey);
        cacheRef.current.set(
          nextKey,
          getMonthLazyLoadData(nextYear, nextMonth, weekStart)
        );
      }
    }, 0);
  }, [weekStart, getCacheKey]);

  /**
   * 预加载滑动方向的下一个月份
   * 在动画开始时调用，预加载更远的月份
   */
  const preloadNextInDirection = useCallback((currentYear: number, currentMonth: number, direction: 'prev' | 'next') => {
    let targetYear: number;
    let targetMonth: number;

    if (direction === 'next') {
      // 向左滑动，预加载 next 的 next
      targetMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      targetYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      // 再往后一个月
      const nextNextMonth = targetMonth === 12 ? 1 : targetMonth + 1;
      const nextNextYear = targetMonth === 12 ? targetYear + 1 : targetYear;
      preloadMonth(nextNextYear, nextNextMonth);
    } else {
      // 向右滑动，预加载 prev 的 prev
      targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      // 再往前一个月
      const prevPrevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
      const prevPrevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
      preloadMonth(prevPrevYear, prevPrevMonth);
    }
  }, [preloadMonth]);

  /**
   * 清理过期缓存（保留当前月前后各3个月）
   */
  const cleanupCache = useCallback((currentYear: number, currentMonth: number) => {
    const validRange = new Set<string>();
    for (let offset = -3; offset <= 3; offset++) {
      let m = currentMonth + offset;
      let y = currentYear;
      if (m < 1) { m += 12; y -= 1; }
      if (m > 12) { m -= 12; y += 1; }
      validRange.add(getCacheKey(y, m));
    }

    // 删除不在有效范围内的缓存
    let cleanedCount = 0;
    for (const key of cacheRef.current.keys()) {
      if (!validRange.has(key)) {
        cacheRef.current.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log('[Preload] Cleaned', cleanedCount, 'expired cache entries');
    }
  }, [getCacheKey]);

  /**
   * 清除所有缓存（用于 weekStart 变化时）
   */
  const clearAllCache = useCallback(() => {
    console.log('[Preload] Clearing all cache');
    cacheRef.current.clear();
    preloadingRef.current.clear();
  }, []);

  return {
    getLazyLoadData,
    preloadMonth,
    preloadNextInDirection,
    cleanupCache,
    clearAllCache,
  };
}
