import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import dayjs from 'dayjs';
import { useAppTheme } from '../../theme/useAppTheme';
import { useEventStore } from '../../store/eventStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useLunarStore } from '../../store/lunarStore';
import { getDayLazyLoadData } from '../../utils/lazyLoadUtils';
import { Event } from '../../types/event';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// 时间线常量
const HOUR_HEIGHT = 80; // 每小时的高度
const TIME_LABEL_WIDTH = 60; // 时间标签宽度
const SINGLE_EVENT_WIDTH = 90; // 单个事件的宽度
const EVENT_PADDING = 6; // 事件之间的间距

// 扩展 Event 类型，添加 widthOrder 属性
interface EventWithOrder extends Event {
  widthOrder?: number;
}

export default function DayView() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { selectedDate, setSelectedDate, getEventsForDate } = useEventStore();
  const showLunar = useSettingsStore(state => state.settings.showLunar);
  const showSolarTerms = useSettingsStore(state => state.settings.showSolarTerms);
  const showTraditionalFestivals = useSettingsStore(state => state.settings.showTraditionalFestivals);

  // 使用 LunarStore 获取农历方法
  const { getFullDateInfo, formatLunarDate, isSolarTermDate, isFestivalDate } = useLunarStore();

  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false); // 标记是否正在动画中
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 使用 ref 存储 widthOrder 计算结果，避免重复计算
  const widthOrderMapRef = useRef<Map<string, number>>(new Map());

  // 使用时间戳作为依赖项，确保 Date 对象变化能被检测到
  const selectedDateKey = selectedDate.getTime();

  // 手动管理懒加载数据状态
  const [lazyLoadData, setLazyLoadData] = useState(() => {
    console.log('Initial day lazy load data');
    return getDayLazyLoadData(selectedDate);
  });
  
  // 使用 ref 保存最新的懒加载数据，避免闭包问题
  const lazyLoadDataRef = useRef(lazyLoadData);
  
  // 每次 lazyLoadData 更新时，同步更新 ref
  useEffect(() => {
    lazyLoadDataRef.current = lazyLoadData;
    
    // 如果正在动画中且数据已更新，重置 translateX
    if (isAnimatingRef.current) {
      console.log('Day data updated after animation, resetting translateX');
      translateX.setValue(0);
      isAnimatingRef.current = false;
    }
  }, [lazyLoadData]);

  // 监听 selectedDateKey 变化，手动更新懒加载数据
  useEffect(() => {
    console.log('useEffect triggered! Updating day lazy load data for:', selectedDate);
    const newData = getDayLazyLoadData(selectedDate);
    setLazyLoadData(newData);
  }, [selectedDateKey]);

  const { prev: prevDayData, current: currentDayData, next: nextDayData } = lazyLoadData;

  // 日期标题的滑动手势处理
  const headerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // 向右滑动 - 上一天
          isAnimatingRef.current = true;
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 使用 ref 获取最新的懒加载数据
            const latestData = lazyLoadDataRef.current;
            console.log('Swiping to previous day');
            setSelectedDate(latestData.prev.date);
            // 不立即重置 translateX，等待 lazyLoadData 更新后再重置
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // 向左滑动 - 下一天
          isAnimatingRef.current = true;
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 使用 ref 获取最新的懒加载数据
            const latestData = lazyLoadDataRef.current;
            console.log('Swiping to next day');
            setSelectedDate(latestData.next.date);
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

  // 渲染日期标题（带滑动功能）
  const renderHeader = (date: Date) => {
    // 获取农历信息
    const dateInfo = showLunar ? getFullDateInfo(date) : null;

    // 获取农历显示文本
    let lunarInfo = '';
    let festivals: string[] = [];
    if (dateInfo) {
      lunarInfo = formatLunarDate(dateInfo.lunar, 'full');
      if (showTraditionalFestivals && isFestivalDate(dateInfo)) {
        festivals = dateInfo.festivals.map(f => f.name);
      }
      if (showSolarTerms && isSolarTermDate(dateInfo)) {
        festivals.unshift(dateInfo.solarTerm!.name);
      }
    }

    return (
      <View style={styles.header}>
        <Text style={styles.dateText}>{dayjs(date).format('YYYY年M月D日')}</Text>
        <Text style={styles.weekDayText}>{dayjs(date).format('dddd')}</Text>
        {showLunar && dateInfo && (
          <View style={styles.lunarInfoContainer}>
            <Text style={styles.lunarDateText}>{lunarInfo}</Text>
            <Text style={styles.zodiacText}>【{dateInfo.lunar.zodiac}年】</Text>
            {festivals.length > 0 && (
              <Text style={styles.festivalText}>{festivals.join(' · ')}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // 计算事件堆叠的 widthOrder（贪心算法，尽量复用空闲列）
  const calculateWidthOrders = useCallback((events: EventWithOrder[]): Map<string, number> => {
    const resultMap = new Map<string, number>();
    
    if (events.length === 0) return resultMap;

    // 按开始时间排序
    const sortedEvents = [...events].sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    // prevMaxBottom[j] 表示第 j 列（widthOrder = j+1）当前占用的最大底部位置
    const prevMaxBottom: number[] = [];

    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      const currentStart = dayjs(currentEvent.startTime);
      const currentEnd = dayjs(currentEvent.endTime);
      const currentTop = (currentStart.hour() + currentStart.minute() / 60) * HOUR_HEIGHT;
      const currentBottom = (currentEnd.hour() + currentEnd.minute() / 60) * HOUR_HEIGHT;

      let assignedOrder = -1;

      // 从左到右尝试找到一个可用的列（有时间空隙）
      for (let j = 0; j < prevMaxBottom.length; j++) {
        if (currentTop >= prevMaxBottom[j]) {
          // 找到空隙，可以复用第 j 列
          assignedOrder = j + 1; // widthOrder 从 1 开始
          prevMaxBottom[j] = currentBottom; // 更新该列的最大底部
          break;
        }
      }

      if (assignedOrder === -1) {
        // 没有找到可用列，需要新开一列
        assignedOrder = prevMaxBottom.length + 1;
        prevMaxBottom.push(currentBottom);
      }

      resultMap.set(currentEvent.id, assignedOrder);
    }

    return resultMap;
  }, []);

  // 计算事件在时间线上的位置和高度
  const getEventStyle = useCallback((event: Event, widthOrder: number) => {
    const startTime = dayjs(event.startTime);
    const endTime = dayjs(event.endTime);
    
    const startHour = startTime.hour();
    const startMinute = startTime.minute();
    
    // 计算顶部位置（从开始时间）
    const top = (startHour + startMinute / 60) * HOUR_HEIGHT;
    
    // 计算高度（持续时间）
    const durationInMinutes = endTime.diff(startTime, 'minute');
    const height = Math.max((durationInMinutes / 60) * HOUR_HEIGHT, 30); // 最小高度30
    
    // 计算水平位置
    const left = (widthOrder - 1) * (SINGLE_EVENT_WIDTH + EVENT_PADDING);
    
    return { top, height, left, width: SINGLE_EVENT_WIDTH };
  }, []);

  // 渲染日程内容
  const renderDayContent = (date: Date) => {
    const allEvents = getEventsForDate(date);
    
    // 分离全天事件和普通事件
    const allDayEvents = allEvents.filter(e => e.isAllDay);
    const regularEvents = allEvents.filter(e => !e.isAllDay);
    
    // 计算所有普通事件的 widthOrder
    const widthOrderMap = calculateWidthOrders(regularEvents);
    
    // 计算最大 widthOrder 用于确定内容宽度
    let maxWidthOrder = 1;
    widthOrderMap.forEach(order => {
      if (order > maxWidthOrder) maxWidthOrder = order;
    });
    
    // 计算时间线内容区域所需的总宽度
    const contentWidth = SCREEN_WIDTH - TIME_LABEL_WIDTH;
    const totalEventsWidth = maxWidthOrder * (SINGLE_EVENT_WIDTH + EVENT_PADDING);
    const timelineContentWidth = Math.max(contentWidth, totalEventsWidth);
    
    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 全天事件区域 - 放在顶部但透明度降低 */}
        {allDayEvents.length > 0 && (
          <View style={styles.allDaySection}>
            <Text style={styles.allDaySectionTitle}>全天</Text>
            {allDayEvents.map(event => (
              <View
                key={event.id}
                style={[styles.allDayEventBlock, { backgroundColor: event.color }]}>
                <Text style={styles.allDayEventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* 时间线 - 使用相对定位的容器 */}
        <View style={styles.timelineContainer}>
          {/* 时间标签列 */}
          <View style={styles.timeLabelsColumn}>
            {hours.map(hour => (
              <View key={hour} style={styles.hourLabelRow}>
                <Text style={styles.hourLabel}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
              </View>
            ))}
          </View>
          
          {/* 事件内容区域 - 支持水平滚动 */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.eventsScrollView}
            contentContainerStyle={[
              styles.eventsScrollContent,
              { width: timelineContentWidth }
            ]}
          >
            {/* 时间线网格 */}
            <View style={styles.timelineGrid}>
              {hours.map(hour => (
                <View key={hour} style={styles.hourGridRow}>
                  <View style={styles.hourLine} />
                </View>
              ))}
            </View>
            
            {/* 事件层 - 绝对定位 */}
            <View style={styles.eventsLayer}>
              {regularEvents.map(event => {
                const widthOrder = widthOrderMap.get(event.id) || 1;
                const eventStyle = getEventStyle(event, widthOrder);
                
                return (
                  <View
                    key={event.id}
                    style={[
                      styles.eventBlock,
                      {
                        backgroundColor: event.color,
                        top: eventStyle.top,
                        left: eventStyle.left,
                        height: eventStyle.height,
                        width: eventStyle.width,
                      }
                    ]}
                  >
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.eventTime} numberOfLines={1}>
                      {dayjs(event.startTime).format('HH:mm')} -{' '}
                      {dayjs(event.endTime).format('HH:mm')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* 日期标题（支持左右滑动切换日期） */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateX }],
            // 初始偏移量：向左偏移一个屏幕宽度，显示中间的 currentDayData
            marginLeft: -SCREEN_WIDTH,
          },
        ]}
        {...headerPanResponder.panHandlers}>
        <View style={styles.dayWrapper}>
          {renderHeader(prevDayData.date)}
        </View>
        <View style={styles.dayWrapper}>
          {renderHeader(currentDayData.date)}
        </View>
        <View style={styles.dayWrapper}>
          {renderHeader(nextDayData.date)}
        </View>
      </Animated.View>

      {/* 时间线区域（保持上下滚动） */}
      {renderDayContent(selectedDate)}
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
    headerContainer: {
      flexDirection: 'row',
    },
    dayWrapper: {
      width: SCREEN_WIDTH,
    },
    header: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      alignItems: 'center',
    },
    dateText: {
      fontSize: theme.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    weekDayText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    scrollView: {
      flex: 1,
    },
    // === 时间线布局样式 ===
    timelineContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    timeLabelsColumn: {
      width: TIME_LABEL_WIDTH,
    },
    hourLabelRow: {
      height: HOUR_HEIGHT,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 4,
    },
    hourLabel: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    eventsScrollView: {
      flex: 1,
    },
    eventsScrollContent: {
      position: 'relative',
    },
    timelineGrid: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    hourGridRow: {
      height: HOUR_HEIGHT,
    },
    hourLine: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    eventsLayer: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      height: 24 * HOUR_HEIGHT, // 24小时的高度
    },
    eventBlock: {
      position: 'absolute',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      opacity: 0.9,
      overflow: 'hidden',
    },
    eventTitle: {
      fontSize: theme.fontSize.sm,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    eventTime: {
      fontSize: theme.fontSize.xs,
      color: '#FFFFFF',
      marginTop: 2,
    },
    // === 农历信息样式 ===
    lunarInfoContainer: {
      marginTop: 8,
      alignItems: 'center',
    },
    lunarDateText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    zodiacText: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    festivalText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.error,
      fontWeight: '500',
      marginTop: 4,
    },
    // === 全天事件样式 ===
    allDaySection: {
      padding: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    allDaySectionTitle: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    allDayEventBlock: {
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.sm,
      marginBottom: 4,
      opacity: 0.6,
    },
    allDayEventTitle: {
      fontSize: theme.fontSize.sm,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
