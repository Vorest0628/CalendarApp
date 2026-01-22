import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import {
  isToday,
  isSameDay,
  getYearMonthString,
} from '../../utils/dateUtils';
import { useEventStore } from '../../store/eventStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useLunarStore } from '../../store/lunarStore';
import { WeekStart } from '../../types/settings';
import { getMonthLazyLoadData, MonthData, useMonthPreload } from '../../utils/lazyLoadUtils';
import { FullDateInfo } from '../../types/lunar';

// ==================== DayCell 组件 ====================

interface DayCellProps {
  date: Date;
  showLunar: boolean;
  showTraditionalFestivals: boolean;
  showSolarTerms: boolean;
  theme: ReturnType<typeof useAppTheme>;
  onPress: (date: Date) => void;
}

/**
 * 日期单元格组件（Memoized）
 * 核心优化：使用 Zustand selector 返回布尔值，而非订阅整个 selectedDate 对象
 * 效果：点击日期时仅 2 个单元格重渲染（旧选中 + 新选中），而非全部 90 个
 */
const DayCell = memo<DayCellProps>(
  ({ date, showLunar, showTraditionalFestivals, showSolarTerms, theme, onPress }) => {
    // 🔥 关键优化：selector 返回布尔值，而非 Date 对象
    // 只有当 isSelected 从 true→false 或 false→true 时才触发重渲染
    const isSelected = useEventStore(
      state => isSameDay(date, state.selectedDate)
    );

    // 🔥 优化：使用 getEventsForDate 获取事件数量（包含重复事件）
    const eventsCount = useEventStore(state => {
      return state.getEventsForDate(date).length;
    });

    const isTodayDate = isToday(date);

    // 使用 LunarStore 获取农历方法
    const { getFullDateInfo, getLunarDisplayText, isFestivalDate, isSolarTermDate } = useLunarStore();

    // 获取农历信息
    const dateInfo = showLunar ? getFullDateInfo(date) : null;
    const lunarText = dateInfo ? getLunarDisplayText(dateInfo, showTraditionalFestivals, showSolarTerms) : '';

    // 获取农历文本颜色
    const getLunarTextColor = (info: FullDateInfo): string => {
      if (showTraditionalFestivals && isFestivalDate(info)) {
        return theme.colors.error; // 节日用红色
      }
      if (showSolarTerms && isSolarTermDate(info)) {
        return theme.colors.success; // 节气用绿色
      }
      return theme.colors.textSecondary;
    };

    const lunarColor = dateInfo ? getLunarTextColor(dateInfo) : theme.colors.textSecondary;

    const styles = useMemo(() => createDayCellStyles(theme), [theme]);

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          isSelected && styles.selectedDayCell,
          isTodayDate && !isSelected && styles.todayCell,
        ]}
        onPress={() => onPress(date)}>
        <Text
          style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isTodayDate && !isSelected && styles.todayText,
          ]}>
          {date.getDate()}
        </Text>
        {showLunar && (
          <Text
            style={[
              styles.lunarText,
              isSelected && styles.selectedLunarText,
              { color: isSelected ? '#FFFFFF' : lunarColor },
            ]}
            numberOfLines={1}>
            {lunarText}
          </Text>
        )}
        {eventsCount > 0 && (
          <View style={styles.eventDot}>
            <Text style={styles.eventCount}>{eventsCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
  // 自定义比较函数：只比较会影响渲染的 props
  (prevProps, nextProps) => {
    return (
      prevProps.date.getTime() === nextProps.date.getTime() &&
      prevProps.showLunar === nextProps.showLunar &&
      prevProps.showTraditionalFestivals === nextProps.showTraditionalFestivals &&
      prevProps.showSolarTerms === nextProps.showSolarTerms &&
      prevProps.theme === nextProps.theme
      // onPress 通过 useCallback 稳定化，无需比较
    );
  }
);

// DayCell 固定高度，保证每行高度一致
const DAY_CELL_HEIGHT = 64;

// DayCell 样式（独立出来避免重复创建）
const createDayCellStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    dayCell: {
      width: '14.28%',
      height: DAY_CELL_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xs,
    },
    selectedDayCell: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
    },
    todayCell: {
      borderWidth: 2,
      borderColor: theme.colors.today,
      borderRadius: theme.borderRadius.full,
    },
    dayText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    selectedDayText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    todayText: {
      color: theme.colors.today,
      fontWeight: 'bold',
    },
    eventDot: {
      position: 'absolute',
      top: 4,
      left: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventCount: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    lunarText: {
      fontSize: 9,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
    selectedLunarText: {
      color: '#FFFFFF',
    },
  });

// ==================== MonthView 组件 ====================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15; // 滑动阈值

export default function MonthView() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [currentDate, setCurrentDate] = useState(new Date());
  // 🔥 优化：不再订阅 selectedDate 和 getEventsForDate，这些由 DayCell 组件内部处理
  const setSelectedDate = useEventStore(state => state.setSelectedDate);
  // 获取选中日期用于底部显示
  const selectedDate = useEventStore(state => state.selectedDate);
  const weekStart = useSettingsStore(state => state.settings.weekStart);
  const showLunar = useSettingsStore(state => state.settings.showLunar);
  const showSolarTerms = useSettingsStore(state => state.settings.showSolarTerms);
  const showTraditionalFestivals = useSettingsStore(state => state.settings.showTraditionalFestivals);
  
  // 使用 LunarStore 获取农历信息
  const { getFullDateInfo } = useLunarStore();
  
  // 获取选中日期的完整农历信息
  const selectedDateInfo = useMemo(() => {
    if (!selectedDate) return null;
    return getFullDateInfo(selectedDate);
  }, [selectedDate, getFullDateInfo]);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false); // 标记是否正在动画中
  
  // 🔥 性能优化：使用预加载 Hook 实现动画与数据加载并发
  const { 
    getLazyLoadData, 
    preloadMonth, 
    preloadNextInDirection, 
    cleanupCache, 
    clearAllCache 
  } = useMonthPreload(weekStart);

  // 保存上一次的 weekStart，用于检测变化
  const prevWeekStartRef = useRef(weekStart);
  
  // 使用时间戳作为依赖项，确保 Date 对象变化能被检测到
  const currentDateKey = currentDate.getTime();
  
  // 🔥 优化：使用预加载 Hook 获取懒加载数据（优先从缓存读取）
  const [lazyLoadData, setLazyLoadData] = useState(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    console.log('[MonthView] Initial lazy load data for:', year, month, 'with weekStart:', weekStart);
    return getLazyLoadData(year, month);
  });
  
  // 使用 ref 保存最新的懒加载数据，避免闭包问题
  const lazyLoadDataRef = useRef(lazyLoadData);
  
  // 每次 lazyLoadData 更新时，同步更新 ref
  useEffect(() => {
    lazyLoadDataRef.current = lazyLoadData;
    
    // 如果正在动画中且数据已更新，重置 translateX
    if (isAnimatingRef.current) {
      console.log('[MonthView] Data updated after animation, resetting translateX');
      translateX.setValue(0);
      isAnimatingRef.current = false;
    }
  }, [lazyLoadData]);

  // 监听 weekStart 变化，清除缓存
  useEffect(() => {
    if (prevWeekStartRef.current !== weekStart) {
      console.log('[MonthView] WeekStart changed, clearing cache');
      clearAllCache();
      prevWeekStartRef.current = weekStart;
    }
  }, [weekStart, clearAllCache]);

  // 监听 currentDateKey 或 weekStart 变化，手动更新懒加载数据
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    console.log('[MonthView] useEffect triggered! Updating lazy load data for:', year, month, 'weekStart:', weekStart);
    // 🔥 优化：从缓存获取数据（如果已预加载，则瞬时返回）
    const newData = getLazyLoadData(year, month);
    console.log('[MonthView] New data obtained');
    setLazyLoadData(newData);
    
    // 🔥 清理过期缓存，保持内存占用可控
    cleanupCache(year, month);
  }, [currentDateKey, weekStart, getLazyLoadData, cleanupCache]);

  // 直接从 lazyLoadData 解构，确保使用最新数据
  const { prev: prevMonthData, current: currentMonthData, next: nextMonthData } = lazyLoadData;
  
  // 用于显示标题的年月
  const year = currentMonthData.year;
  const month = currentMonthData.month;
  console.log('[MonthView] Rendering month view for:', year, month);

  // 🔥 性能优化：使用 useMemo 创建 PanResponder，在手势开始时预加载
  const panResponder = useMemo(() => 
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      // 🔥 关键优化：手势开始时立即预加载前后月份数据
      onPanResponderGrant: () => {
        const { year: curYear, month: curMonth } = lazyLoadDataRef.current.current;
        const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
        const prevYear = curMonth === 1 ? curYear - 1 : curYear;
        const nextMonth = curMonth === 12 ? 1 : curMonth + 1;
        const nextYear = curMonth === 12 ? curYear + 1 : curYear;
        
        console.log('[MonthView] Gesture started, preloading adjacent months');
        preloadMonth(prevYear, prevMonth);
        preloadMonth(nextYear, nextMonth);
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // 向右滑动 - 上一个月
          isAnimatingRef.current = true;
          
          // 🔥 关键：动画开始的同时，预加载更远的月份
          const { year: curYear, month: curMonth } = lazyLoadDataRef.current.current;
          preloadNextInDirection(curYear, curMonth, 'prev');
          
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 使用 ref 获取最新的懒加载数据
            const latestData = lazyLoadDataRef.current;
            const targetDate = new Date(latestData.prev.year, latestData.prev.month - 1, 1);
            console.log('[MonthView] Swiping to previous month:', latestData.prev.year, latestData.prev.month);
            setCurrentDate(targetDate);
            // 不立即重置 translateX，等待 lazyLoadData 更新后再重置
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // 向左滑动 - 下一个月
          isAnimatingRef.current = true;
          
          // 🔥 关键：动画开始的同时，预加载更远的月份
          const { year: curYear, month: curMonth } = lazyLoadDataRef.current.current;
          preloadNextInDirection(curYear, curMonth, 'next');
          
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 使用 ref 获取最新的懒加载数据
            const latestData = lazyLoadDataRef.current;
            const targetDate = new Date(latestData.next.year, latestData.next.month - 1, 1);
            console.log('[MonthView] Swiping to next month:', latestData.next.year, latestData.next.month);
            setCurrentDate(targetDate);
            // 不立即重置 translateX，等待 lazyLoadData 更新后再重置
          });
        } else {
          // 回弹
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  [preloadMonth, preloadNextInDirection, translateX]);

  // 🔥 使用 useCallback 稳定化 handleDatePress，避免 DayCell 不必要的重渲染
  const handleDatePress = useCallback((date: Date) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  const renderEmptyCells = (count: number) => {
    const cells = [];
    for (let i = 0; i < count; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    return cells;
  };

  // 🔥 优化：使用新的 DayCell 组件，每个单元格独立订阅自己的状态
  const renderMonthGrid = (monthData: MonthData) => (
    <View style={styles.monthGrid}>
      {renderEmptyCells(monthData.firstDayOfWeek)}
      {monthData.daysInMonth.map(date => (
        <DayCell
          key={date.toISOString()}
          date={date}
          showLunar={showLunar}
          showTraditionalFestivals={showTraditionalFestivals}
          showSolarTerms={showSolarTerms}
          theme={theme}
          onPress={handleDatePress}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getYearMonthString(year, month)}</Text>
      </View>

      <View style={styles.weekRow}>
        {(weekStart === WeekStart.MONDAY
          ? ['一', '二', '三', '四', '五', '六', '日']
          : ['日', '一', '二', '三', '四', '五', '六']
        ).map((day, index) => (
          <View key={index} style={styles.weekCell}>
            <Text style={styles.weekText}>{day}</Text>
          </View>
        ))}
      </View>

      <Animated.View
        style={[
          styles.swipeContainer,
          {
            transform: [{ translateX }],
            // 初始偏移量：向左偏移一个屏幕宽度，显示中间的 currentMonthData
            marginLeft: -SCREEN_WIDTH,
          },
        ]}
        {...panResponder.panHandlers}>
        <View style={styles.monthWrapper}>
          {renderMonthGrid(prevMonthData)}
        </View>
        <View style={styles.monthWrapper}>
          {renderMonthGrid(currentMonthData)}
        </View>
        <View style={styles.monthWrapper}>
          {renderMonthGrid(nextMonthData)}
        </View>
      </Animated.View>

      {/* 选中日期的农历信息显示区域 */}
      {showLunar && selectedDateInfo && (
        <View style={styles.selectedDateInfo}>
          {/* 主信息行：农历日期 + 生肖 */}
          <View style={styles.lunarMainRow}>
            <Text style={styles.lunarMainText}>
              {selectedDateInfo.lunar.monthCn}{selectedDateInfo.lunar.dayCn}
            </Text>
            <View style={styles.zodiacBadge}>
              <Text style={styles.zodiacText}>{selectedDateInfo.lunar.zodiac}年</Text>
            </View>
          </View>
          
          {/* 干支信息行 */}
          <Text style={styles.ganzhiText}>
            {selectedDateInfo.lunar.yearGanZhi}年 {selectedDateInfo.lunar.monthGanZhi}月 {selectedDateInfo.lunar.dayGanZhi}日
          </Text>
          
          {/* 节气和节日标签 */}
          {((showSolarTerms && selectedDateInfo.solarTerm) || 
            (showTraditionalFestivals && selectedDateInfo.festivals && selectedDateInfo.festivals.length > 0)) && (
            <View style={styles.tagsRow}>
              {showSolarTerms && selectedDateInfo.solarTerm && (
                <View style={styles.solarTermTag}>
                  <Text style={styles.solarTermTagText}>{selectedDateInfo.solarTerm.name}</Text>
                </View>
              )}
              {showTraditionalFestivals && selectedDateInfo.festivals && selectedDateInfo.festivals.map((festival, index) => (
                <View key={index} style={styles.festivalTag}>
                  <Text style={styles.festivalTagText}>{festival.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    header: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    headerTitle: {
      fontSize: theme.fontSize.xxl,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    swipeContainer: {
      flexDirection: 'row',
    },
    monthWrapper: {
      width: SCREEN_WIDTH,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    weekRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: theme.spacing.sm,
    },
    weekCell: {
      flex: 1,
      alignItems: 'center',
    },
    weekText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    // 空单元格的样式（用于月份首日前的占位）
    dayCell: {
      width: '14.28%',
      height: DAY_CELL_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xs,
    },
    // 选中日期的农历信息显示区域
    selectedDateInfo: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lunarMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xs,
    },
    lunarMainText: {
      fontSize: theme.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    zodiacBadge: {
      marginLeft: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primary,
    },
    zodiacText: {
      fontSize: theme.fontSize.xs,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    ganzhiText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    tagsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    solarTermTag: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.success + '20',
      borderWidth: 1,
      borderColor: theme.colors.success,
    },
    solarTermTagText: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.success,
      fontWeight: '600',
    },
    festivalTag: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.error + '20',
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    festivalTagText: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.error,
      fontWeight: '600',
    },
    selectedDateInfoText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      fontWeight: '500',
    },
  });
