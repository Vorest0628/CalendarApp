import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../theme';
import { useEventStore } from '../store/eventStore';
import MonthView from '../components/Calendar/MonthView';
import WeekView from '../components/Calendar/WeekView';
import DayView from '../components/Calendar/DayView';
import Button from '../components/Common/Button';
import { EventForm, EventDetail, EventCard } from '../components/Event';
import { Event } from '../types/event';

type ViewType = 'month' | 'week' | 'day';

export default function HomeScreen() {
  const { currentView, setCurrentView, loadEvents, addEvent, updateEvent, deleteEvent } = useEventStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // 当页面获得焦点时重新加载当月日程
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await loadEvents(startOfMonth, endOfMonth);
      };
      loadData();
    }, [loadEvents])
  );

  // 添加日程
  const handleAddEvent = async (
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>,
    reminderMinutes?: number[]
  ) => {
    try {
      await addEvent(eventData, reminderMinutes);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  // 编辑日程
  const handleEditEvent = async (
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>,
    reminderMinutes?: number[]
  ) => {
    if (selectedEvent) {
      try {
        await updateEvent(selectedEvent.id, eventData);
        // 注意：编辑时的提醒更新需要额外处理
        setShowEditModal(false);
        setShowDetailModal(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Failed to update event:', error);
      }
    }
  };

  // 删除日程
  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      try {
        await deleteEvent(selectedEvent.id);
        setShowDetailModal(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  // 打开日程详情
  const handleOpenEventDetail = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  // 打开编辑模态框
  const handleOpenEdit = () => {
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const renderView = () => {
    switch (currentView) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      default:
        return <MonthView />;
    }
  };

  const renderButton = (view: ViewType, label: string) => {
    const isActive = currentView === view;
    return (
      <Button
        title={label}
        onPress={() => setCurrentView(view)}
        variant={isActive ? 'primary' : 'outline'}
        size="medium"
        style={styles.viewButton}
        textStyle={styles.viewButtonText}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.viewSwitcher}>
          {renderButton('month', '月')}
          {renderButton('week', '周')}
          {renderButton('day', '日')}
        </View>

        {renderView()}

        {/* 添加按钮 */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}>
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 添加日程模态框 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}>
        <EventForm
          onSubmit={handleAddEvent}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* 编辑日程模态框 */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}>
        {selectedEvent && (
          <EventForm
            initialEvent={selectedEvent}
            onSubmit={handleEditEvent}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* 日程详情模态框 */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}>
        {selectedEvent && (
          <EventDetail
            event={selectedEvent}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteEvent}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  viewSwitcher: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  viewButton: {
    flex: 1,
  },
  viewButtonText: {
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
