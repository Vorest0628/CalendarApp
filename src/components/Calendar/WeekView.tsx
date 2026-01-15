import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import { theme } from '../../theme';
import { useEventStore } from '../../store/eventStore';
import { isToday, isSameDay } from '../../utils/dateUtils';

export default function WeekView() {
  const [currentWeekStart] = useState(dayjs().startOf('week').toDate());
  const { selectedDate, setSelectedDate, getEventsForDate } = useEventStore();

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    dayjs(currentWeekStart).add(i, 'day').toDate(),
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        {weekDays.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const eventsCount = getEventsForDate(date).length;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.dateCell, isSelected && styles.selectedDateCell]}
              onPress={() => handleDatePress(date)}>
              <Text style={[styles.weekDayText, isSelected && styles.selectedText]}>
                {dayjs(date).format('ddd')}
              </Text>
              <Text
                style={[
                  styles.dayNumberText,
                  isSelected && styles.selectedText,
                  isTodayDate && !isSelected && styles.todayText,
                ]}>
                {date.getDate()}
              </Text>
              {eventsCount > 0 && <View style={styles.eventIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
        {hours.map(hour => (
          <View key={hour} style={styles.hourRow}>
            <View style={styles.hourLabelContainer}>
              <Text style={styles.hourLabel}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
            </View>
            <View style={styles.hourLine} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dateRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
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
  eventIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.error,
    marginTop: 4,
  },
  timelineContainer: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    height: 60,
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
  hourLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
