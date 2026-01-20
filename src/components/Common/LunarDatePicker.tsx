/**
 * 农历日期选择器组件
 * 提供农历年、月、日的选择能力，支持闰月选择
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useLunarStore } from '../../store/lunarStore';
import { useAppTheme } from '../../theme/useAppTheme';

interface LunarDateValue {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

interface LunarDatePickerProps {
  /** 当前选中的农历日期 */
  value?: LunarDateValue;
  /** 日期变更回调 */
  onChange: (value: LunarDateValue) => void;
  /** 最小可选年份（默认当前年-100） */
  minYear?: number;
  /** 最大可选年份（默认当前年+50） */
  maxYear?: number;
}

/**
 * 农历日期选择器组件
 */
export const LunarDatePicker: React.FC<LunarDatePickerProps> = ({
  value,
  onChange,
  minYear,
  maxYear,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 使用 LunarStore 获取农历方法
  const { getLunarYearList, getLunarMonthList, getLunarDayList, lunarToSolar } = useLunarStore();

  const currentYear = new Date().getFullYear();
  const effectiveMinYear = minYear ?? currentYear - 100;
  const effectiveMaxYear = maxYear ?? currentYear + 50;

  // 默认值
  const [selectedYear, setSelectedYear] = useState<number>(value?.year ?? currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(value?.month ?? 1);
  const [selectedDay, setSelectedDay] = useState<number>(value?.day ?? 1);
  const [isLeapMonth, setIsLeapMonth] = useState<boolean>(value?.isLeapMonth ?? false);

  // 模态框状态
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  // 获取年份列表
  const yearList = useMemo(() => {
    return getLunarYearList(effectiveMinYear, effectiveMaxYear);
  }, [effectiveMinYear, effectiveMaxYear, getLunarYearList]);

  // 获取月份列表（含闰月）
  const monthList = useMemo(() => {
    return getLunarMonthList(selectedYear);
  }, [selectedYear, getLunarMonthList]);

  // 获取日期列表
  const dayList = useMemo(() => {
    return getLunarDayList(selectedYear, selectedMonth, isLeapMonth);
  }, [selectedYear, selectedMonth, isLeapMonth, getLunarDayList]);

  // 通知父组件值变更
  const notifyChange = useCallback((
    year: number,
    month: number,
    day: number,
    leap: boolean
  ) => {
    onChange({ year, month, day, isLeapMonth: leap });
  }, [onChange]);

  // 选择年份
  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setShowYearPicker(false);

    // 重新计算月份和日期
    const newMonthList = getLunarMonthList(year);
    const hasLeapMonth = newMonthList.some(m => m.isLeap && m.value === selectedMonth);
    const newIsLeap = hasLeapMonth ? isLeapMonth : false;

    const newDayList = getLunarDayList(year, selectedMonth, newIsLeap);
    const newDay = Math.min(selectedDay, newDayList.length);

    setIsLeapMonth(newIsLeap);
    setSelectedDay(newDay);
    notifyChange(year, selectedMonth, newDay, newIsLeap);
  };

  // 选择月份
  const handleMonthSelect = (month: number, leap: boolean) => {
    setSelectedMonth(month);
    setIsLeapMonth(leap);
    setShowMonthPicker(false);

    // 重新计算日期
    const newDayList = getLunarDayList(selectedYear, month, leap);
    const newDay = Math.min(selectedDay, newDayList.length);

    setSelectedDay(newDay);
    notifyChange(selectedYear, month, newDay, leap);
  };

  // 选择日期
  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    setShowDayPicker(false);
    notifyChange(selectedYear, selectedMonth, day, isLeapMonth);
  };

  // 获取当前显示的月份标签
  const currentMonthLabel = useMemo(() => {
    const found = monthList.find(m => m.value === selectedMonth && m.isLeap === isLeapMonth);
    return found?.label ?? '正月';
  }, [monthList, selectedMonth, isLeapMonth]);

  // 获取当前显示的日期标签
  const currentDayLabel = useMemo(() => {
    const found = dayList.find(d => d.value === selectedDay);
    return found?.label ?? '初一';
  }, [dayList, selectedDay]);

  // 渲染选择器模态框
  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: { value: number; label: string; isLeap?: boolean }[],
    onSelect: (value: number, isLeap?: boolean) => void,
    selectedValue: number,
    selectedIsLeap?: boolean
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>关闭</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {items.map((item, index) => {
              const isSelected = item.value === selectedValue && 
                (item.isLeap === undefined || item.isLeap === selectedIsLeap);
              return (
                <TouchableOpacity
                  key={`${item.value}-${item.isLeap ? 'leap' : 'normal'}-${index}`}
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                  onPress={() => onSelect(item.value, item.isLeap)}>
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>农历日期</Text>
      <View style={styles.pickerRow}>
        {/* 年份选择 */}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowYearPicker(true)}>
          <Text style={styles.pickerButtonText}>{selectedYear}年</Text>
        </TouchableOpacity>

        {/* 月份选择 */}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowMonthPicker(true)}>
          <Text style={styles.pickerButtonText}>{currentMonthLabel}</Text>
        </TouchableOpacity>

        {/* 日期选择 */}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowDayPicker(true)}>
          <Text style={styles.pickerButtonText}>{currentDayLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* 显示对应的公历日期 */}
      <Text style={styles.solarDateText}>
        对应公历：{lunarToSolar(selectedYear, selectedMonth, selectedDay, isLeapMonth).toLocaleDateString('zh-CN')}
      </Text>

      {/* 年份选择器 */}
      {renderPickerModal(
        showYearPicker,
        () => setShowYearPicker(false),
        '选择农历年',
        yearList,
        (val) => handleYearSelect(val),
        selectedYear
      )}

      {/* 月份选择器 */}
      {renderPickerModal(
        showMonthPicker,
        () => setShowMonthPicker(false),
        '选择农历月',
        monthList,
        (val, leap) => handleMonthSelect(val, leap ?? false),
        selectedMonth,
        isLeapMonth
      )}

      {/* 日期选择器 */}
      {renderPickerModal(
        showDayPicker,
        () => setShowDayPicker(false),
        '选择农历日',
        dayList,
        (val) => handleDaySelect(val),
        selectedDay
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    pickerRow: {
      flexDirection: 'row',
      gap: 8,
    },
    pickerButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    pickerButtonText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    solarDateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '60%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      fontSize: 16,
      color: theme.colors.primary,
    },
    pickerList: {
      padding: 8,
    },
    pickerItem: {
      padding: 16,
      borderRadius: 8,
    },
    pickerItemSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    pickerItemText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
    },
    pickerItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });

export default LunarDatePicker;
