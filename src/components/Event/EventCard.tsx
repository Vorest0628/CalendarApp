/**
 * 日程卡片组件（用于列表展示）
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Event } from '../../types/event';
import { colors } from '../../theme/colors';

interface EventCardProps {
  event: Event; // 日程数据
  onPress: () => void; // 点击回调
  showDate?: boolean; // 是否显示日期
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  showDate = false,
}) => {
  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTimeDisplay = (): string => {
    if (event.isAllDay) {
      return '全天';
    }
    return `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* 颜色标签 */}
      <View style={[styles.colorBar, { backgroundColor: event.color }]} />

      <View style={styles.content}>
        {/* 日期（可选） */}
        {showDate && (
          <Text style={styles.date}>{formatDate(event.startTime)}</Text>
        )}

        {/* 标题 */}
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>

        {/* 时间 */}
        <View style={styles.timeRow}>
          <Icon name="access-time" size={14} color={colors.textSecondary} />
          <Text style={styles.time}>{getTimeDisplay()}</Text>
        </View>

        {/* 地点 */}
        {event.location && (
          <View style={styles.locationRow}>
            <Icon name="location-on" size={14} color={colors.textSecondary} />
            <Text style={styles.location} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}

        {/* 描述 */}
        {event.description && (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        {/* 重复标记 */}
        {event.rrule && (
          <View style={styles.repeatBadge}>
            <Icon name="repeat" size={12} color={colors.primary} />
            <Text style={styles.repeatText}>重复</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
  },
  repeatText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
});
