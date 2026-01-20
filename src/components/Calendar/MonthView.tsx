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
import { getMonthLazyLoadData, MonthData } from '../../utils/lazyLoadUtils';
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

    // 🔥 优化：selector 返回事件数量，而非事件数组
    const eventsCount = useEventStore(state => {
      return state.events.filter(event => {
        const eventDate = new Date(event.startTime);
        return (
          eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate()
        );
      }).length;
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

// DayCell 样式（独立出来避免重复创建）
const createDayCellStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
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
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 滑动阈值

export default function MonthView() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [currentDate, setCurrentDate] = useState(new Date());
  // 🔥 优化：不再订阅 selectedDate 和 getEventsForDate，这些由 DayCell 组件内部处理
  const setSelectedDate = useEventStore(state => state.setSelectedDate);
  const weekStart = useSettingsStore(state => state.settings.weekStart);
  const showLunar = useSettingsStore(state => state.settings.showLunar);
  const showSolarTerms = useSettingsStore(state => state.settings.showSolarTerms);
  const showTraditionalFestivals = useSettingsStore(state => state.settings.showTraditionalFestivals);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false); // 标记是否正在动画中
  
  // 使用时间戳作为依赖项，确保 Date 对象变化能被检测到
  const currentDateKey = currentDate.getTime();
  
  // 手动管理懒加载数据状态
  const [lazyLoadData, setLazyLoadData] = useState(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    console.log('Initial lazy load data for:', year, month, 'with weekStart:', weekStart);
    return getMonthLazyLoadData(year, month, weekStart);
  });
  
  // 使用 ref 保存最新的懒加载数据，避免闭包问题
  const lazyLoadDataRef = useRef(lazyLoadData);
  
  // 每次 lazyLoadData 更新时，同步更新 ref
  useEffect(() => {
    lazyLoadDataRef.current = lazyLoadData;
    
    // 如果正在动画中且数据已更新，重置 translateX
    if (isAnimatingRef.current) {
      console.log('Data updated after animation, resetting translateX');
      translateX.setValue(0);
      isAnimatingRef.current = false;
    }
  }, [lazyLoadData]);

  // 监听 currentDateKey 或 weekStart 变化，手动更新懒加载数据
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    console.log('useEffect triggered! Updating lazy load data for:', year, month, 'weekStart:', weekStart);
    const newData = getMonthLazyLoadData(year, month, weekStart);
    console.log('New data calculated:', newData);
    setLazyLoadData(newData);
  }, [currentDateKey, weekStart]); // 依赖项包含 weekStart

  // 直接从 lazyLoadData 解构，确保使用最新数据
  const { prev: prevMonthData, current: currentMonthData, next: nextMonthData } = lazyLoadData;
  
  // 用于显示标题的年月
  const year = currentMonthData.year;
  const month = currentMonthData.month;
  console.log('Rendering month view for:', year, month);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // 向右滑动 - 上一个月
          isAnimatingRef.current = true;
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 使用 ref 获取最新的懒加载数据
            const latestData = lazyLoadDataRef.current;
            const targetDate = new Date(latestData.prev.year, latestData.prev.month - 1, 1);
            console.log('Swiping to previous month:', latestData.prev.year, latestData.prev.month);
            setCurrentDate(targetDate);
            // 不立即重置 translateX，等待 lazyLoadData 更新后再重置
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // 向左滑动 - 下一个月
          isAnimatingRef.current = true;
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 使用 ref 获取最新的懒加载数据
            const latestData = lazyLoadDataRef.current;
            const targetDate = new Date(latestData.next.year, latestData.next.month - 1, 1);
            console.log('Swiping to next month:', latestData.next.year, latestData.next.month);
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
    })
  ).current;

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
      fontSize: theme.fontSize.lg,
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
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xs,
    },
  });
