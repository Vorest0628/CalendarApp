import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import dayjs from 'dayjs';
import { useAppTheme } from '../../theme/useAppTheme';
import { useEventStore } from '../../store/eventStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useLunarStore } from '../../store/lunarStore';
import { WeekStart } from '../../types/settings';
import { isToday, isSameDay } from '../../utils/dateUtils';
import { Event } from '../../types/event';
import { getWeekLazyLoadData } from '../../utils/lazyLoadUtils';
import { FullDateInfo } from '../../types/lunar';

const HOUR_HEIGHT = 60; // 每小时的高度
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// ==================== WeekDayCell 组件 ====================

interface WeekDayCellProps {
  date: Date;
  weekDayLabel: string;
  showLunar: boolean;
  showTraditionalFestivals: boolean;
  showSolarTerms: boolean;
  theme: ReturnType<typeof useAppTheme>;
  onPress: (date: Date) => void;
}

/**
 * 周视图日期单元格组件（Memoized）
 * 核心优化：使用 Zustand selector 返回布尔值，而非订阅整个 selectedDate 对象
 * 效果：点击日期时仅 2 个单元格重渲染（旧选中 + 新选中），而非全部 7 个
 */
const WeekDayCell = memo<WeekDayCellProps>(
  ({ date, weekDayLabel, showLunar, showTraditionalFestivals, showSolarTerms, theme, onPress }) => {
    // 🔥 关键优化：selector 返回布尔值，而非 Date 对象
    const isSelected = useEventStore(
      state => isSameDay(date, state.selectedDate)
    );

    // 🔥 优化：selector 返回事件数量，而非事件数组
    const hasEvents = useEventStore(state => {
      return state.events.some(event => {
        const eventDate = new Date(event.startTime);
        return (
          eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate()
        );
      });
    });

    const isTodayDate = isToday(date);

    // 使用 LunarStore 获取农历方法
    const { getFullDateInfo, getLunarDisplayText, isFestivalDate, isSolarTermDate } = useLunarStore();

    // 获取农历信息
    const dateInfo = showLunar ? getFullDateInfo(date) : null;
    const lunarText = dateInfo ? getLunarDisplayText(dateInfo, showTraditionalFestivals, showSolarTerms) : '';

    // 获取农历文本颜色
    const getLunarTextColor = (info: FullDateInfo): string => {
      if (isSelected) {
        return '#FFFFFF';
      }
      if (showTraditionalFestivals && isFestivalDate(info)) {
        return theme.colors.error;
      }
      if (showSolarTerms && isSolarTermDate(info)) {
        return theme.colors.success;
      }
      return theme.colors.textSecondary;
    };

    const lunarColor = dateInfo ? getLunarTextColor(dateInfo) : theme.colors.textSecondary;

    const styles = useMemo(() => createWeekDayCellStyles(theme), [theme]);

    return (
      <TouchableOpacity
        style={[styles.dateCell, isSelected && styles.selectedDateCell]}
        onPress={() => onPress(date)}>
        <Text style={[styles.weekDayText, isSelected && styles.selectedText]}>
          {weekDayLabel}
        </Text>
        <Text
          style={[
            styles.dayNumberText,
            isSelected && styles.selectedText,
            isTodayDate && !isSelected && styles.todayText,
          ]}>
          {date.getDate()}
        </Text>
        {showLunar && (
          <Text style={[styles.lunarText, { color: lunarColor }]} numberOfLines={1}>
            {lunarText}
          </Text>
        )}
        {/* 始终预留红点空间，避免布局跳动 */}
        <View style={styles.eventIndicatorWrapper}>
          {hasEvents && <View style={styles.eventIndicator} />}
        </View>
      </TouchableOpacity>
    );
  },
  // 自定义比较函数：只比较会影响渲染的 props
  (prevProps, nextProps) => {
    return (
      prevProps.date.getTime() === nextProps.date.getTime() &&
      prevProps.weekDayLabel === nextProps.weekDayLabel &&
      prevProps.showLunar === nextProps.showLunar &&
      prevProps.showTraditionalFestivals === nextProps.showTraditionalFestivals &&
      prevProps.showSolarTerms === nextProps.showSolarTerms &&
      prevProps.theme === nextProps.theme
    );
  }
);

// WeekDayCell 样式
const createWeekDayCellStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    dateCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    selectedDateCell: {
      backgroundColor: theme.colors.primary,
    },
    weekDayText: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    dayNumberText: {
      fontSize: theme.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    selectedText: {
      color: '#FFFFFF',
    },
    todayText: {
      color: theme.colors.today,
    },
    eventIndicatorWrapper: {
      height: 10,
      marginTop: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.error,
    },
    lunarText: {
      fontSize: 9,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });

// ==================== WeekView 组件 ====================

export default function WeekView() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 🔥 优化：不再订阅 selectedDate 和 getEventsForDate，这些由 WeekDayCell 组件内部处理
  const setSelectedDate = useEventStore(state => state.setSelectedDate);
  const loadEvents = useEventStore(state => state.loadEvents);
  const events = useEventStore(state => state.events);
  const weekStartSetting = useSettingsStore(state => state.settings.weekStart);
  const showLunar = useSettingsStore(state => state.settings.showLunar);
  const showSolarTerms = useSettingsStore(state => state.settings.showSolarTerms);
  const showTraditionalFestivals = useSettingsStore(state => state.settings.showTraditionalFestivals);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = dayjs();
    const day = d.day(); // 0-6 (Sun-Sat)
    if (weekStartSetting === WeekStart.MONDAY) {
      const offset = (day + 6) % 7;
      return d.subtract(offset, 'day').startOf('day').toDate();
    }
    const offset = day;
    return d.subtract(offset, 'day').startOf('day').toDate();
  });
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false); // 标记是否正在动画中

  // 使用时间戳作为依赖项，确保 Date 对象变化能被检测到
  const currentWeekKey = currentWeekStart.getTime();

  // 手动管理懒加载数据状态
  const [lazyLoadData, setLazyLoadData] = useState(() => {
    console.log('Initial week lazy load data');
    return getWeekLazyLoadData(currentWeekStart);
  });
  
  // 使用 ref 保存最新的懒加载数据，避免闭包问题
  const lazyLoadDataRef = useRef(lazyLoadData);
  
  // 每次 lazyLoadData 更新时，同步更新 ref
  useEffect(() => {
    lazyLoadDataRef.current = lazyLoadData;
    
    // 如果正在动画中且数据已更新，重置 translateX
    if (isAnimatingRef.current) {
      console.log('Week data updated after animation, resetting translateX');
      translateX.setValue(0);
      isAnimatingRef.current = false;
    }
  }, [lazyLoadData]);

  // 监听 currentWeekKey 或 weekStartSetting 变化，手动更新懒加载数据
  useEffect(() => {
    console.log('useEffect triggered! Updating week lazy load data for:', currentWeekStart, 'weekStart:', weekStartSetting);
    const newData = getWeekLazyLoadData(currentWeekStart);
    setLazyLoadData(newData);
  }, [currentWeekKey, weekStartSetting]);

  // 监听 weekStartSetting 变化，调整当前的 currentWeekStart
  useEffect(() => {
    const d = dayjs(currentWeekStart);
    const day = d.day();
    let newStart;
    if (weekStartSetting === WeekStart.MONDAY) {
      // 转换到周一
      const offset = (day + 6) % 7;
      newStart = d.subtract(offset, 'day').startOf('day');
    } else {
      // 转换到周日
      const offset = day;
      newStart = d.subtract(offset, 'day').startOf('day');
    }
    
    if (!newStart.isSame(dayjs(currentWeekStart), 'day')) {
      setCurrentWeekStart(newStart.toDate());
    }
  }, [weekStartSetting]);
  const { prev: prevWeekData, current: currentWeekData, next: nextWeekData } = lazyLoadData;
  const weekDays = currentWeekData.weekDays;

  const weekDayLabels = useMemo(() => {
    return weekStartSetting === WeekStart.MONDAY
      ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  }, [weekStartSetting]);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 加载当前周及相邻周的事件（一次性加载，避免多次状态更新导致闪烁）
  useEffect(() => {
    const { prev: prevWeekData, current: currentWeekData, next: nextWeekData } = lazyLoadDataRef.current;
    
    // 计算整个时间范围：从上一周的第一天到下一周的最后一天
    const rangeStart = dayjs(prevWeekData.weekStart).startOf('day').toDate();
    const rangeEnd = dayjs(nextWeekData.weekStart).add(6, 'day').endOf('day').toDate();
    
    console.log('Loading events for week range:', rangeStart, 'to', rangeEnd);
    // 一次性加载整个范围的事件，避免多次状态更新
    loadEvents(rangeStart, rangeEnd);
  }, [lazyLoadData, loadEvents]);

  // 日期选择行的滑动手势处理
  const dateRowPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // 向右滑动 - 上一周
          isAnimatingRef.current = true;
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 使用 ref 获取最新的懒加载数据
            const latestData = lazyLoadDataRef.current;
            console.log('Swiping to previous week');
            setCurrentWeekStart(latestData.prev.weekStart);
            // 不立即重置 translateX，等待 lazyLoadData 更新后再重置
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // 向左滑动 - 下一周
          isAnimatingRef.current = true;
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 使用 ref 获取最新的懒加载数据
            const latestData = lazyLoadDataRef.current;
            console.log('Swiping to next week');
            setCurrentWeekStart(latestData.next.weekStart);
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

  // 🔥 使用 useCallback 稳定化 handleDatePress，避免 WeekDayCell 不必要的重渲染
  const handleDatePress = useCallback((date: Date) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  // 计算事件在时间线上的位置和高度
  const getEventStyle = (event: Event) => {
    const startTime = dayjs(event.startTime);
    const endTime = dayjs(event.endTime);
    
    const startHour = startTime.hour();
    const startMinute = startTime.minute();
    const endHour = endTime.hour();
    const endMinute = endTime.minute();
    
    // 计算顶部位置（从开始时间）
    const top = (startHour + startMinute / 60) * HOUR_HEIGHT;
    
    // 计算高度（持续时间）
    const durationInMinutes = endTime.diff(startTime, 'minute');
    const height = Math.max((durationInMinutes / 60) * HOUR_HEIGHT, 20); // 最小高度20
    
    return { top, height };
  };

  // 获取某一天的所有事件
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = dayjs(event.startTime);
      return eventDate.isSame(dayjs(date), 'day');
    });
  };

  // 🔥 优化：使用新的 WeekDayCell 组件，每个单元格独立订阅自己的状态
  const renderDateRow = (weekDaysData: Date[]) => (
    <View style={styles.dateRow}>
      {weekDaysData.map((date, index) => (
        <WeekDayCell
          key={date.toISOString()}
          date={date}
          weekDayLabel={weekDayLabels[index]}
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
      {/* 日期选择行（支持左右滑动切换周） */}
      <Animated.View
        style={[
          styles.dateRowContainer,
          {
            transform: [{ translateX }],
            // 初始偏移量：向左偏移一个屏幕宽度，显示中间的 currentWeekData
            marginLeft: -SCREEN_WIDTH,
          },
        ]}
        {...dateRowPanResponder.panHandlers}>
        <View style={styles.weekWrapper}>
          {renderDateRow(prevWeekData.weekDays)}
        </View>
        <View style={styles.weekWrapper}>
          {renderDateRow(currentWeekData.weekDays)}
        </View>
        <View style={styles.weekWrapper}>
          {renderDateRow(nextWeekData.weekDays)}
        </View>
      </Animated.View>

      {/* 时间线区域（保持上下滚动） */}
      <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.timelineContent}>
          {/* 时间轴 */}
          <View style={styles.timeLabels}>
            {hours.map(hour => (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourLabel}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
              </View>
            ))}
          </View>

          {/* 日期列 */}
          <View style={styles.daysContainer}>
            {weekDays.map((date, dayIndex) => {
              const dayEvents = getEventsForDay(date);
              
              return (
                <View key={dayIndex} style={styles.dayColumn}>
                  {/* 小时分隔线 */}
                  {hours.map(hour => (
                    <View key={hour} style={styles.hourLine} />
                  ))}
                  
                  {/* 事件卡片 */}
                  {dayEvents.map(event => {
                    const { top, height } = getEventStyle(event);
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.eventCard,
                          {
                            top,
                            height,
                            backgroundColor: event.color || theme.colors.primary,
                          },
                        ]}
                        activeOpacity={0.8}>
                        <Text style={styles.eventTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.eventTime} numberOfLines={1}>
                          {dayjs(event.startTime).format('HH:mm')} - {dayjs(event.endTime).format('HH:mm')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    dateRowContainer: {
      flexDirection: 'row',
    },
    weekWrapper: {
      width: SCREEN_WIDTH,
    },
    dateRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: theme.spacing.sm,
    },
    timelineContainer: {
      flex: 1,
    },
    timelineContent: {
      flexDirection: 'row',
      minHeight: 24 * 60, // 24小时 * 60像素
    },
    timeLabels: {
      width: 50,
    },
    hourRow: {
      height: 60,
      justifyContent: 'flex-start',
      paddingTop: 4,
    },
    hourLabel: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    daysContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    dayColumn: {
      flex: 1,
      position: 'relative',
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
    },
    hourLine: {
      height: 60,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    eventCard: {
      position: 'absolute',
      left: 2,
      right: 2,
      borderRadius: 4,
      padding: 4,
      overflow: 'hidden',
    },
    eventTitle: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.xs,
      fontWeight: '600',
    },
    eventTime: {
      color: '#FFFFFF',
      fontSize: 10,
      marginTop: 2,
      opacity: 0.9,
    },
  });
