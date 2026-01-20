import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import dayjs from 'dayjs';
import { useAppTheme } from '../../theme/useAppTheme';
import { useEventStore } from '../../store/eventStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useLunarStore } from '../../store/lunarStore';
import { getDayLazyLoadData } from '../../utils/lazyLoadUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

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

  // 渲染日程内容
  const renderDayContent = (date: Date) => {
    const events = getEventsForDate(date);
    
    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {hours.map(hour => {
          const hourEvents = events.filter(event => {
            const eventHour = new Date(event.startTime).getHours();
            return eventHour === hour;
          });

          return (
            <View key={hour} style={styles.hourRow}>
              <View style={styles.hourLabelContainer}>
                <Text style={styles.hourLabel}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
              </View>
              <View style={styles.hourContent}>
                <View style={styles.hourLine} />
                {hourEvents.map(event => (
                  <View
                    key={event.id}
                    style={[styles.eventBlock, { backgroundColor: event.color }]}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.eventTime} numberOfLines={1}>
                      {dayjs(event.startTime).format('HH:mm')} -{' '}
                      {dayjs(event.endTime).format('HH:mm')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
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
    hourRow: {
      flexDirection: 'row',
      height: 80,
    },
    hourLabelContainer: {
      width: 60,
      alignItems: 'center',
      paddingTop: 4,
    },
    hourLabel: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    hourContent: {
      flex: 1,
      position: 'relative',
    },
    hourLine: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    eventBlock: {
      position: 'absolute',
      left: 0,
      right: theme.spacing.md,
      top: 8,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      opacity: 0.9,
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
  });
