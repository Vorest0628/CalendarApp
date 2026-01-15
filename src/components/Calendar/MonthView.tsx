import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  isToday,
  isSameDay,
  getYearMonthString,
} from '../../utils/dateUtils';
import { useEventStore } from '../../store/eventStore';
import Button from '../Common/Button';

export default function MonthView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { selectedDate, setSelectedDate, getEventsForDate } = useEventStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // JavaScript 月份是 0-11，需要 +1

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const renderEmptyCells = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          onPress={goToPrevMonth}
          variant="text"
          icon={<Icon name="chevron-left" size={28} color={theme.colors.text} />}
          style={styles.navButton}
        />

        <Text style={styles.headerTitle}>{getYearMonthString(year, month)}</Text>

        <Button
          onPress={goToNextMonth}
          variant="text"
          icon={<Icon name="chevron-right" size={28} color={theme.colors.text} />}
          style={styles.navButton}
        />
      </View>

      <View style={styles.weekRow}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <View key={index} style={styles.weekCell}>
            <Text style={styles.weekText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysContainer}>
        {renderEmptyCells()}
        {daysInMonth.map(date => renderDayCell(date))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  navButton: {
    padding: 0,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
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
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
