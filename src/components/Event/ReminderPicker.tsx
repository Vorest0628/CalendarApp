/**
 * 提醒时间选择器组件
 * 
 * 数据格式约定：
 * - 正数：相对时间，表示提前 X 分钟提醒（如 30 表示提前30分钟）
 * - 负数：固定时间，绝对值表示当天的分钟数（如 -480 表示当天 8:00，即 8*60=480）
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { REMINDER_PRESETS } from '../../types/event';
import { useAppTheme, AppColors } from '../../theme/useAppTheme';

interface ReminderPickerProps {
  selectedMinutes: number[]; // 已选择的提醒时间（分钟数数组）
  onSelect: (minutes: number[]) => void; // 选择回调
  isAllDay?: boolean; // 是否全天事件（全天事件只显示固定时间选项）
}

/**
 * 判断是否为固定时间提醒（负数）
 */
const isFixedTimeReminder = (value: number): boolean => value < 0;

/**
 * 将固定时间值转换为小时和分钟
 * @param value 负数值，绝对值为当天分钟数
 */
const fixedValueToTime = (value: number): { hours: number; minutes: number } => {
  const totalMinutes = Math.abs(value);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
};

/**
 * 将小时和分钟转换为固定时间值（负数）
 */
const timeToFixedValue = (hours: number, minutes: number): number => {
  return -(hours * 60 + minutes);
};

const ReminderPicker: React.FC<ReminderPickerProps> = ({
  selectedMinutes,
  onSelect,
  isAllDay = false,
}) => {
  const theme = useAppTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [modalVisible, setModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    // 默认选择 9:00
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });

  /**
   * 格式化显示文本
   */
  const formatMinutes = (minutes: number): string => {
    if (isFixedTimeReminder(minutes)) {
      const { hours, minutes: mins } = fixedValueToTime(minutes);
      return `当天 ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    const preset = REMINDER_PRESETS.find(p => p.value === minutes);
    return preset ? preset.label : `提前 ${minutes} 分钟`;
  };

  /**
   * 添加提醒
   */
  const handleAdd = (minutes: number) => {
    if (!selectedMinutes.includes(minutes)) {
      const newMinutes = [...selectedMinutes, minutes].sort((a, b) => a - b);
      onSelect(newMinutes);
    }
    setModalVisible(false);
  };

  /**
   * 添加固定时间提醒
   */
  const handleAddFixedTime = () => {
    setShowTimePicker(true);
  };

  /**
   * 处理时间选择
   */
  const handleTimeChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selected) {
      setSelectedTime(selected);
      const fixedValue = timeToFixedValue(selected.getHours(), selected.getMinutes());
      
      if (!selectedMinutes.includes(fixedValue)) {
        const newMinutes = [...selectedMinutes, fixedValue].sort((a, b) => a - b);
        onSelect(newMinutes);
      }
      
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
      setModalVisible(false);
    }
  };

  /**
   * 移除提醒
   */
  const handleRemove = (minutes: number) => {
    const newMinutes = selectedMinutes.filter(m => m !== minutes);
    onSelect(newMinutes);
  };

  /**
   * 渲染预设选项
   */
  const renderPresetItem = ({ item }: { item: typeof REMINDER_PRESETS[0] }) => {
    const isSelected = selectedMinutes.includes(item.value);

    return (
      <TouchableOpacity
        style={[styles.presetItem, isSelected && styles.presetItemSelected]}
        onPress={() => handleAdd(item.value)}
        disabled={isSelected}>
        <Text
          style={[
            styles.presetText,
            isSelected && styles.presetTextSelected,
          ]}>
          {item.label}
        </Text>
        {isSelected && (
          <Icon name="check" size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  // 过滤显示的提醒：全天事件只显示固定时间提醒
  const displayedReminders = isAllDay 
    ? selectedMinutes.filter(m => isFixedTimeReminder(m))
    : selectedMinutes;

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <View style={styles.header}>
        <Icon name="notifications" size={20} color={colors.textSecondary} />
        <Text style={styles.label}>提醒</Text>
        {isAllDay && (
          <Text style={styles.allDayHint}>（全天事件仅支持固定时间提醒）</Text>
        )}
      </View>

      {/* 已选提醒列表 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipContainer}>
        {displayedReminders.length === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}>
            <Icon name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>添加提醒</Text>
          </TouchableOpacity>
        ) : (
          <>
            {displayedReminders.map(minutes => (
              <View key={minutes} style={[
                styles.chip,
                isFixedTimeReminder(minutes) && styles.fixedTimeChip
              ]}>
                <Text style={styles.chipText}>{formatMinutes(minutes)}</Text>
                <TouchableOpacity onPress={() => handleRemove(minutes)}>
                  <Icon name="close" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addChipButton}
              onPress={() => setModalVisible(true)}>
              <Icon name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* 选择模态框 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择提醒时间</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* 固定时间选择入口 */}
            <TouchableOpacity
              style={styles.fixedTimeButton}
              onPress={handleAddFixedTime}>
              <Icon name="schedule" size={24} color={colors.primary} />
              <View style={styles.fixedTimeTextContainer}>
                <Text style={styles.fixedTimeTitle}>选择固定时间</Text>
                <Text style={styles.fixedTimeDesc}>在当天指定时间提醒</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* 相对时间预设列表（全天事件时隐藏） */}
            {!isAllDay && (
              <>
                <Text style={styles.sectionTitle}>提前提醒</Text>
                <FlatList
                  data={REMINDER_PRESETS}
                  keyExtractor={item => item.value.toString()}
                  renderItem={renderPresetItem}
                  ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
                />
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 时间选择器 */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      flexWrap: 'wrap',
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    allDayHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    chipContainer: {
      flexDirection: 'row',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      marginRight: 8,
    },
    fixedTimeChip: {
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      color: colors.text,
      marginRight: 8,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    addButtonText: {
      fontSize: 14,
      color: colors.primary,
      marginLeft: 4,
    },
    addChipButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    fixedTimeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      margin: 16,
      borderRadius: 12,
    },
    fixedTimeTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    fixedTimeTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    fixedTimeDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    presetItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    presetItemSelected: {
      backgroundColor: colors.surface,
    },
    presetText: {
      fontSize: 16,
      color: colors.text,
    },
    presetTextSelected: {
      color: colors.primary,
      fontWeight: '500',
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    itemSeparator: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
  });

export default ReminderPicker;
