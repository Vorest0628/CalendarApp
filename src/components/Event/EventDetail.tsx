/**
 * 日程详情展示组件
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Event } from '../../types/event';
import { useAppTheme, AppColors } from '../../theme/useAppTheme';
import { parseRRule, getRuleDescription } from '../../utils/rruleUtils';

interface EventDetailProps {
  event: Event; // 日程数据
  onEdit: () => void; // 编辑回调
  onDelete: () => void; // 删除回调
  onClose: () => void; // 关闭回调
}

export const EventDetail: React.FC<EventDetailProps> = ({
  event,
  onEdit,
  onDelete,
  onClose,
}) => {
  const theme = useAppTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这个日程吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (event.isAllDay) {
      return `${year}年${month}月${day}日`;
    }
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  };

  const formatTimeRange = (): string => {
    const start = formatDateTime(event.startTime);
    const end = formatDateTime(event.endTime);

    if (event.isAllDay) {
      return `${start}（全天）`;
    }

    // 如果是同一天，只显示一次日期
    const startDate = event.startTime.toDateString();
    const endDate = event.endTime.toDateString();

    if (startDate === endDate) {
      const startTime = event.startTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const endTime = event.endTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${start.split(' ')[0]} ${startTime} - ${endTime}`;
    }

    return `${start} - ${end}`;
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日程详情</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
            <Icon name="edit" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
            <Icon name="delete" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容 */}
      <ScrollView style={styles.content}>
        {/* 标题 */}
        <View style={styles.section}>
          <View style={[styles.colorBar, { backgroundColor: event.color }]} />
          <Text style={styles.title}>{event.title}</Text>
        </View>

        {/* 时间 */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Icon name="access-time" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>{formatTimeRange()}</Text>
          </View>
        </View>

        {/* 地点 */}
        {event.location && (
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Icon name="location-on" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{event.location}</Text>
            </View>
          </View>
        )}

        {/* 描述 */}
        {event.description && (
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Icon name="description" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{event.description}</Text>
            </View>
          </View>
        )}

        {/* 重复规则 */}
        {event.rrule && (
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Icon name="repeat" size={20} color={colors.textSecondary} />
              <View style={styles.repeatInfoContainer}>
                <Text style={styles.infoText}>重复日程</Text>
                {(() => {
                  const rule = parseRRule(event.rrule);
                  if (rule) {
                    const description = getRuleDescription(rule);
                    return (
                      <Text style={styles.repeatDescription}>{description}</Text>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>
          </View>
        )}

        {/* 创建和更新时间 */}
        <View style={styles.section}>
          <Text style={styles.metaText}>
            创建于: {event.createdAt.toLocaleString('zh-CN')}
          </Text>
          {event.updatedAt && event.updatedAt > event.createdAt && (
            <Text style={styles.metaText}>
              更新于: {event.updatedAt.toLocaleString('zh-CN')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    closeButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    colorBar: {
      width: 4,
      height: '100%',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    metaText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    repeatInfoContainer: {
      flex: 1,
    },
    repeatDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
  });
