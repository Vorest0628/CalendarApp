import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import {
  isToday,
  isSameDay,
  getYearMonthString,
} from '../../utils/dateUtils';
import { useEventStore } from '../../store/eventStore';
import { useSettingsStore } from '../../store/settingsStore';
import { WeekStart } from '../../types/settings';
import { getMonthLazyLoadData, MonthData } from '../../utils/lazyLoadUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 滑动阈值

export default function MonthView() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const { selectedDate, setSelectedDate, getEventsForDate } = useEventStore();
  const weekStart = useSettingsStore(state => state.settings.weekStart);
  
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

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const renderEmptyCells = (count: number) => {
    const cells = [];
    for (let i = 0; i < count; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    return cells;
  };

  const renderDayCell = (date: Date) => {
    const day = date.getDate();
    const isSelected = isSameDay(date, selectedDate);
    const isTodayDate = isToday(date);
    const eventsCount = getEventsForDate(date).length;

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dayCell,
          isSelected && styles.selectedDayCell,
          isTodayDate && !isSelected && styles.todayCell,
        ]}
        onPress={() => handleDatePress(date)}>
        <Text
          style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isTodayDate && !isSelected && styles.todayText,
          ]}>
          {day}
        </Text>
        {eventsCount > 0 && (
          <View style={styles.eventDot}>
            <Text style={styles.eventCount}>{eventsCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMonthGrid = (monthData: MonthData) => (
    <View style={styles.monthGrid}>
      {renderEmptyCells(monthData.firstDayOfWeek)}
      {monthData.daysInMonth.map(date => renderDayCell(date))}
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
  });
