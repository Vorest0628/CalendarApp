import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../theme/useAppTheme';
import { useEventStore } from '../store/eventStore';
import { EventCard, EventDetail, EventForm } from '../components/Event';
import { Event } from '../types/event';
import DatabaseService from '../database/DatabaseService';

export default function EventListScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { events, isLoading, loadEvents, updateEvent, deleteEvent } = useEventStore();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [searchText, setSearchText] = useState('');

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
  const handleEditEvent = async (
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>,
    reminderMinutes?: number[]
  ) => {
    if (selectedEvent) {
      try {
        await updateEvent(selectedEvent.id, eventData, reminderMinutes);
        setShowEditModal(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Failed to update event:', error);
        Alert.alert('错误', '更新日程失败');
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

  // 按日期排序并根据搜索关键词过滤
  const filteredEvents = useMemo(() => {
    let result = [...events];
    
    // 根据搜索关键词过滤
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(keyword)
      );
    }
    
    // 按日期排序
    return result.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [events, searchText]);

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
        <Text style={styles.count}>共 {filteredEvents.length} 个日程</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索日程标题..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={filteredEvents}
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

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
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
    searchInput: {
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    listContent: {
      paddingVertical: 8,
    },
    emptyText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
  });
