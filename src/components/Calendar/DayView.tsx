import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import dayjs from 'dayjs';
import { theme } from '../../theme';
import { useEventStore } from '../../store/eventStore';

export default function DayView() {
  const { selectedDate, getEventsForDate } = useEventStore();
  const events = getEventsForDate(selectedDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{dayjs(selectedDate).format('YYYY年M月D日')}</Text>
        <Text style={styles.weekDayText}>{dayjs(selectedDate).format('dddd')}</Text>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
});
