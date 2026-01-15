import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { useEventStore } from '../store/eventStore';
import { EventCard, EventDetail, EventForm } from '../components/Event';
import { Event } from '../types/event';
import DatabaseService from '../database/DatabaseService';

export default function EventListScreen() {
  const { events, isLoading, loadEvents, updateEvent, deleteEvent } = useEventStore();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  // 检查数据库是否就绪
  React.useEffect(() => {
    const checkDb = async () => {
      try {
        // 等待数据库初始化完成
        await DatabaseService.init();
        setIsDbReady(true);
      } catch (error) {
        // 数据库已经初始化
        setIsDbReady(true);
      }
    };
    checkDb();
  }, []);

  // 当页面获得焦点时加载日程
  useFocusEffect(
    React.useCallback(() => {
      if (!isDbReady) {
        return;
      }

      const loadData = async () => {
        // 加载过去3个月到未来3个月的日程
        const now = new Date();
        const startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 3);
        await loadEvents(startDate, endDate);
      };
      loadData();
    }, [isDbReady])
  );

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

  // 编辑日程
  const handleEditEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEvent) {
      try {
        await updateEvent(selectedEvent.id, eventData);
        setShowEditModal(false);
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

  // 按日期排序
  const sortedEvents = [...events].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Text style={styles.emptyText}>暂无日程</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>日程列表</Text>
        <Text style={styles.count}>共 {events.length} 个日程</Text>
      </View>

      <FlatList
        data={sortedEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => handleOpenEventDetail(item)}
            showDate={true}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  count: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});
