import React, { useState, useMemo, useEffect, memo } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, Alert, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useEventStore } from '../store/eventStore';
import MonthView from '../components/Calendar/MonthView';
import WeekView from '../components/Calendar/WeekView';
import DayView from '../components/Calendar/DayView';
import Button from '../components/Common/Button';
import { EventForm, EventDetail, EventCard } from '../components/Event';
import NotificationPermission from '../components/Permission/NotificationPermission';
import { Event } from '../types/event';

type ViewType = 'month' | 'week' | 'day';

// 🔥 优化：将视图包装成 memo 组件，避免不必要的重渲染
interface ViewWrapperProps {
  isActive: boolean;
  children: React.ReactNode;
  style: any;
  hiddenStyle: any;
}

const ViewWrapper = memo<ViewWrapperProps>(
  ({ isActive, children, style, hiddenStyle }) => (
    <View style={[style, !isActive && hiddenStyle]}>
      {children}
    </View>
  ),
  (prev, next) => prev.isActive === next.isActive
);

// 🔥 优化：将视图组件包装成 memo，避免父组件重渲染时重新创建
const MemoizedMonthView = memo(MonthView);
const MemoizedWeekView = memo(WeekView);
const MemoizedDayView = memo(DayView);

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { currentView, setCurrentView, loadEvents, addEvent, updateEvent, deleteEvent } = useEventStore();
  
  // 🔥 视图预加载：跟踪已挂载的视图（首屏只挂载当前视图）
  const [mountedViews, setMountedViews] = useState<Set<ViewType>>(() => new Set([currentView]));
  
  // 首屏渲染完成后，在空闲时预挂载其他视图
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      // 预挂载所有视图，后续切换将瞬时完成
      setMountedViews(new Set(['month', 'week', 'day']));
    });
    return () => task.cancel();
  }, []);
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
        await updateEvent(selectedEvent.id, eventData, reminderMinutes);
        setShowEditModal(false);
        setShowDetailModal(false);
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

  // 🔥 优化：视图保持挂载，通过样式控制显示/隐藏（避免重复挂载开销）
  const renderViews = () => {
    return (
      <>
        {/* 月视图 */}
        {mountedViews.has('month') && (
          <ViewWrapper
            isActive={currentView === 'month'}
            style={styles.viewContainer}
            hiddenStyle={styles.hiddenView}>
            <MemoizedMonthView />
          </ViewWrapper>
        )}
        {/* 周视图 */}
        {mountedViews.has('week') && (
          <ViewWrapper
            isActive={currentView === 'week'}
            style={styles.viewContainer}
            hiddenStyle={styles.hiddenView}>
            <MemoizedWeekView />
          </ViewWrapper>
        )}
        {/* 日视图 */}
        {mountedViews.has('day') && (
          <ViewWrapper
            isActive={currentView === 'day'}
            style={styles.viewContainer}
            hiddenStyle={styles.hiddenView}>
            <MemoizedDayView />
          </ViewWrapper>
        )}
      </>
    );
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
      {/* 通知权限提示（独立 Modal） */}
      <NotificationPermission />

      <View style={styles.content}>
        <View style={styles.viewSwitcher}>
          {renderButton('month', '月')}
          {renderButton('week', '周')}
          {renderButton('day', '日')}
        </View>

        {/* 视图区域容器 */}
        <View style={styles.viewArea}>
          {renderViews()}
        </View>

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

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    // 🔥 视图区域容器：相对定位，作为视图的参照系
    viewArea: {
      flex: 1,
      position: 'relative',
    },
    // 🔥 视图容器：占满空间
    viewContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    // 🔥 隐藏视图：不可见且不响应触摸
    hiddenView: {
      opacity: 0,
      pointerEvents: 'none',
    },
    viewSwitcher: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.sm,
      zIndex: 10, // 确保切换按钮在视图之上
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
