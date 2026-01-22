/**
 * 日程添加/编辑表单组件
 */
import React, { useState, useEffect, useMemo } from 'react';
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
import { useAppTheme, AppColors } from '../../theme/useAppTheme';
import ReminderPicker from './ReminderPicker';
import ReminderService from '../../services/ReminderService';
import { useSettingsStore } from '../../store/settingsStore';
import { useLunarStore } from '../../store/lunarStore';
import LunarDatePicker from '../Common/LunarDatePicker';
import { RepeatRule, generateRRule } from '../../utils/rruleUtils';

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
  onSubmit: (
    event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>,
    reminderMinutes?: number[]
  ) => void; // 提交回调
  onCancel: () => void; // 取消回调
}

export const EventForm: React.FC<EventFormProps> = ({
  initialEvent,
  onSubmit,
  onCancel,
}) => {
  const theme = useAppTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const defaultReminderMinutesSetting = useSettingsStore(
    state => state.settings.defaultReminderMinutes
  );

  // 使用 LunarStore 获取农历方法
  const { solarToLunar, lunarToSolar } = useLunarStore();

  const [reminderMinutes, setReminderMinutes] = useState<number[]>(() => {
    if (initialEvent) {
      return [];
    }
    if (
      defaultReminderMinutesSetting &&
      defaultReminderMinutesSetting.length > 0
    ) {
      return [...defaultReminderMinutesSetting];
    }
    return [];
  });
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

  // === 第6周新增：农历日程 ===
  const [isLunarEvent, setIsLunarEvent] = useState<boolean>(initialEvent?.isLunar || false);
  const [lunarDate, setLunarDate] = useState<{
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  } | null>(() => {
    if (initialEvent?.isLunar) {
      // 从公历时间转换为农历
      const lunar = solarToLunar(initialEvent.startTime);
      return {
        year: lunar.year,
        month: lunar.month,
        day: lunar.day,
        isLeapMonth: lunar.isLeapMonth,
      };
    }
    return null;
  });

  // 重复规则设置
  const [isRepeatEvent, setIsRepeatEvent] = useState<boolean>(!!initialEvent?.rrule);
  const [repeatFrequency, setRepeatFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('DAILY');
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [repeatCount, setRepeatCount] = useState<number>(10);

  // 在编辑模式下，加载现有的提醒设置
  useEffect(() => {
    if (initialEvent) {
      const loadReminders = async () => {
        try {
          const reminders = await ReminderService.getEventReminders(initialEvent.id);
          if (reminders.length > 0) {
            const minutes = reminders.map(reminder => {
              const diff = initialEvent.startTime.getTime() - reminder.triggerTime.getTime();
              return Math.floor(diff / 60000);
            });
            setReminderMinutes(minutes);
          }
        } catch (error) {
          console.error('Failed to load reminders:', error);
        }
      };
      loadReminders();
    }
  }, [initialEvent]);

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

  // 当农历日期变更时，更新公历时间
  useEffect(() => {
    if (isLunarEvent && lunarDate) {
      const solarDate = lunarToSolar(
        lunarDate.year,
        lunarDate.month,
        lunarDate.day,
        lunarDate.isLeapMonth
      );
      // 保留原来的时间部分
      solarDate.setHours(startTime.getHours(), startTime.getMinutes());
      setStartTime(solarDate);

      // 结束时间也调整到同一天
      const newEndTime = new Date(solarDate);
      newEndTime.setHours(endTime.getHours(), endTime.getMinutes());
      if (newEndTime <= solarDate) {
        newEndTime.setHours(solarDate.getHours() + 1);
      }
      setEndTime(newEndTime);
    }
  }, [lunarDate, isLunarEvent]);

  const handleSubmit = async () => {
    // 表单验证
    if (!title.trim()) {
      Alert.alert('提示', '请输入日程标题');
      return;
    }

    if (startTime >= endTime) {
      Alert.alert('提示', '结束时间必须晚于开始时间');
      return;
    }

    // 验证提醒时间（如果设置了提醒）
    // 全天事件或固定时间提醒跳过此验证
    if (reminderMinutes.length > 0 && !isAllDay) {
      const now = Date.now();
      const minReminderTime = 2 * 60 * 1000; // 2分钟
      
      // 只检查相对时间提醒（正数），固定时间提醒（负数）跳过
      for (const minutes of reminderMinutes) {
        // 跳过固定时间提醒（负数）
        if (minutes < 0) {
          continue;
        }
        
        const triggerTime = startTime.getTime() - minutes * 60 * 1000;
        const timeUntilTrigger = triggerTime - now;
        
        if (timeUntilTrigger < minReminderTime) {
          const minutesUntilStart = Math.floor((startTime.getTime() - now) / 60000);
          Alert.alert(
            '提醒时间过近',
            `提醒时间必须至少在当前时间的2分钟后。\n\n` +
            `当前选择：提前${minutes}分钟提醒\n` +
            `日程开始：${minutesUntilStart}分钟后\n\n` +
            `建议：\n` +
            `- 将日程时间设置得更晚一些\n` +
            `- 或减少提醒的提前时间`
          );
          return;
        }
      }
    }

    const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime,
      endTime,
      isAllDay,
      color,
      isLunar: isLunarEvent, // 添加农历标记
      rrule: isRepeatEvent ? generateRRule({
        frequency: repeatFrequency,
        interval: repeatInterval,
        count: repeatCount,
      }) : undefined, // 添加重复规则
    };

    // 提交日程数据，并传递提醒设置
    onSubmit(eventData, reminderMinutes.length > 0 ? reminderMinutes : undefined);
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

        // 全天事件不需要选择时间，直接关闭
        if (isAllDay) {
          setShowStartPicker(false);
          return;
        }

        if (Platform.OS === 'android') {
          // Android 上接着显示时间选择器
          setShowStartTimePicker(true);
        } else if (Platform.OS === 'ios') {
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

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
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

        // 全天事件不需要选择时间，直接关闭
        if (isAllDay) {
          setShowEndPicker(false);
          return;
        }

        if (Platform.OS === 'android') {
          // Android 上接着显示时间选择器
          setShowEndTimePicker(true);
        } else if (Platform.OS === 'ios') {
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

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
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
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateButton, isAllDay && styles.dateButtonFullWidth]}
              onPress={() => {
                setPickerMode('date');
                setShowStartPicker(true);
              }}>
              <Text style={styles.dateText}>
                {startTime.getFullYear()}-{String(startTime.getMonth() + 1).padStart(2, '0')}-{String(startTime.getDate()).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            {!isAllDay && (
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  if (Platform.OS === 'android') {
                    setShowStartTimePicker(true);
                  } else {
                    setPickerMode('time');
                    setShowStartPicker(true);
                  }
                }}>
                <Text style={styles.dateText}>
                  {String(startTime.getHours()).padStart(2, '0')}:{String(startTime.getMinutes()).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 结束时间 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>结束时间</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateButton, isAllDay && styles.dateButtonFullWidth]}
              onPress={() => {
                setPickerMode('date');
                setShowEndPicker(true);
              }}>
              <Text style={styles.dateText}>
                {endTime.getFullYear()}-{String(endTime.getMonth() + 1).padStart(2, '0')}-{String(endTime.getDate()).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            {!isAllDay && (
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  if (Platform.OS === 'android') {
                    setShowEndTimePicker(true);
                  } else {
                    setPickerMode('time');
                    setShowEndPicker(true);
                  }
                }}>
                <Text style={styles.dateText}>
                  {String(endTime.getHours()).padStart(2, '0')}:{String(endTime.getMinutes()).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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

        {/* 第6周新增：农历日程开关 */}
        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>农历日程</Text>
            <Switch
              value={isLunarEvent}
              onValueChange={(value) => {
                setIsLunarEvent(value);
                if (value && !lunarDate) {
                  // 初始化农历日期为当前公历日期对应的农历
                  const lunar = solarToLunar(startTime);
                  setLunarDate({
                    year: lunar.year,
                    month: lunar.month,
                    day: lunar.day,
                    isLeapMonth: lunar.isLeapMonth,
                  });
                }
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          {isLunarEvent && (
            <Text style={styles.lunarHint}>农历日程将显示农历日期，并按农历日期计算</Text>
          )}
        </View>

        {/* 农历日期选择器 */}
        {isLunarEvent && (
          <View style={styles.formGroup}>
            <LunarDatePicker
              value={lunarDate ?? undefined}
              onChange={setLunarDate}
            />
          </View>
        )}

        {/* 重复规则设置 */}
        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>重复日程</Text>
            <Switch
              value={isRepeatEvent}
              onValueChange={setIsRepeatEvent}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          {isRepeatEvent && (
            <View style={styles.repeatOptions}>
              <Text style={styles.repeatLabel}>重复频率</Text>
              <View style={styles.frequencyRow}>
                {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      repeatFrequency === freq && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setRepeatFrequency(freq)}>
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        repeatFrequency === freq && styles.frequencyButtonTextActive,
                      ]}>
                      {freq === 'DAILY' && '每天'}
                      {freq === 'WEEKLY' && '每周'}
                      {freq === 'MONTHLY' && '每月'}
                      {freq === 'YEARLY' && '每年'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.intervalRow}>
                <Text style={styles.repeatLabel}>
                  间隔（
                  {repeatFrequency === 'DAILY' && '天'}
                  {repeatFrequency === 'WEEKLY' && '周'}
                  {repeatFrequency === 'MONTHLY' && '月'}
                  {repeatFrequency === 'YEARLY' && '年'}
                  ）
                </Text>
                <TextInput
                  style={styles.intervalInput}
                  keyboardType="number-pad"
                  value={String(repeatInterval)}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setRepeatInterval(Math.max(1, Math.min(99, num)));
                  }}
                />
              </View>
              <View style={styles.intervalRow}>
                <Text style={styles.repeatLabel}>重复次数</Text>
                <TextInput
                  style={styles.intervalInput}
                  keyboardType="number-pad"
                  value={String(repeatCount)}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setRepeatCount(Math.max(1, Math.min(365, num)));
                  }}
                />
              </View>
            </View>
          )}
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

        {/* 提醒选择 */}
        <View style={styles.formGroup}>
          <ReminderPicker
            selectedMinutes={reminderMinutes}
            onSelect={setReminderMinutes}
            isAllDay={isAllDay}
          />
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

      {/* Android 时间选择器 */}
      {showStartTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          onChange={handleStartTimeChange}
        />
      )}

      {showEndTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          onChange={handleEndTimeChange}
        />
      )}
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
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
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateButtonFullWidth: {
      flex: 1,
    },
    timeButton: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    dateTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
    // === 农历提示样式 ===
    lunarHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
    },
    // === 重复规则样式 ===
    repeatOptions: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    repeatLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    frequencyRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    frequencyButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    frequencyButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    frequencyButtonText: {
      fontSize: 12,
      color: colors.text,
    },
    frequencyButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    intervalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    intervalInput: {
      width: 80,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: 'center',
    },
  });
