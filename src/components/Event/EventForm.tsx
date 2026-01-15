/**
 * 日程添加/编辑表单组件
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Event } from '../../types/event';
import { colors } from '../../theme/colors';

// 预设颜色选项
const COLOR_OPTIONS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
];

interface EventFormProps {
  initialEvent?: Event; // 初始数据（编辑模式）
  onSubmit: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void; // 提交回调
  onCancel: () => void; // 取消回调
}

export const EventForm: React.FC<EventFormProps> = ({
  initialEvent,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState<string>(initialEvent?.title || '');
  const [description, setDescription] = useState<string>(
    initialEvent?.description || ''
  );
  const [location, setLocation] = useState<string>(
    initialEvent?.location || ''
  );
  const [startTime, setStartTime] = useState<Date>(
    initialEvent?.startTime || new Date()
  );
  const [endTime, setEndTime] = useState<Date>(
    initialEvent?.endTime || new Date(Date.now() + 3600000) // 默认1小时后
  );
  const [isAllDay, setIsAllDay] = useState<boolean>(
    initialEvent?.isAllDay || false
  );
  const [color, setColor] = useState<string>(
    initialEvent?.color || COLOR_OPTIONS[0]
  );
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // 当切换全天事件时，调整时间
  useEffect(() => {
    if (isAllDay) {
      const start = new Date(startTime);
      start.setHours(0, 0, 0, 0);
      setStartTime(start);

      const end = new Date(endTime);
      end.setHours(23, 59, 59, 999);
      setEndTime(end);
    }
  }, [isAllDay]);

  const handleSubmit = () => {
    // 表单验证
    if (!title.trim()) {
      Alert.alert('提示', '请输入日程标题');
      return;
    }

    if (startTime >= endTime) {
      Alert.alert('提示', '结束时间必须晚于开始时间');
      return;
    }

    const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime,
      endTime,
      isAllDay,
      color,
    };

    onSubmit(eventData);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }

    if (selectedDate) {
      if (pickerMode === 'date') {
        // 只更新日期部分
        const newStart = new Date(selectedDate);
        newStart.setHours(startTime.getHours(), startTime.getMinutes());
        setStartTime(newStart);

        if (Platform.OS === 'ios') {
          // iOS 上继续显示时间选择器
          setPickerMode('time');
        }
      } else {
        // 更新时间部分
        setStartTime(selectedDate);
        if (Platform.OS === 'ios') {
          setShowStartPicker(false);
        }
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }

    if (selectedDate) {
      if (pickerMode === 'date') {
        const newEnd = new Date(selectedDate);
        newEnd.setHours(endTime.getHours(), endTime.getMinutes());
        setEndTime(newEnd);

        if (Platform.OS === 'ios') {
          setPickerMode('time');
        }
      } else {
        setEndTime(selectedDate);
        if (Platform.OS === 'ios') {
          setShowEndPicker(false);
        }
      }
    }
  };

  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (isAllDay) {
      return `${year}-${month}-${day}`;
    }
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* 标题 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>标题 *</Text>
          <TextInput
            style={styles.input}
            placeholder="输入日程标题"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* 开始时间 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>开始时间</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setPickerMode('date');
              setShowStartPicker(true);
            }}>
            <Text style={styles.dateText}>{formatDateTime(startTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* 结束时间 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>结束时间</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setPickerMode('date');
              setShowEndPicker(true);
            }}>
            <Text style={styles.dateText}>{formatDateTime(endTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* 全天事件 */}
        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>全天事件</Text>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* 地点 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>地点</Text>
          <TextInput
            style={styles.input}
            placeholder="输入地点"
            placeholderTextColor={colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* 描述 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="输入描述"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 颜色选择 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>颜色</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map(colorOption => (
              <TouchableOpacity
                key={colorOption}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorOption },
                  color === colorOption && styles.colorOptionSelected,
                ]}
                onPress={() => setColor(colorOption)}
              />
            ))}
          </View>
        </View>

        {/* 按钮 */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {initialEvent ? '保存' : '添加'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 日期时间选择器 */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode={pickerMode}
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode={pickerMode}
          display="default"
          onChange={handleEndDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
