import { create } from 'zustand';
import { Event } from '../types/event';
import { EventDAO } from '../database/EventDAO';
import ReminderService from '../services/ReminderService';

let eventDAO: EventDAO | null = null;

const getEventDAO = () => {
  if (!eventDAO) {
    eventDAO = new EventDAO();
  }
  return eventDAO;
};

interface EventStore {
  events: Event[];
  selectedDate: Date;
  currentView: 'month' | 'week' | 'day';
  isLoading: boolean;

  /**
   * 从数据库加载日程
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns Promise<void>
   */
  loadEvents: (startDate: Date, endDate: Date) => Promise<void>;

  /**
   * 添加日程
   * @param event - 日程对象（不含 id、createdAt、updatedAt）
   * @param reminderMinutes - 提醒时间列表（分钟）
   * @returns Promise<Event> - 创建的日程对象
   */
  addEvent: (
    event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>,
    reminderMinutes?: number[]
  ) => Promise<Event>;

  /**
   * 更新日程
   * @param id - 日程 ID
   * @param updates - 要更新的字段
   * @returns Promise<void>
   */
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;

  /**
   * 删除日程（同时删除相关提醒）
   * @param id - 日程 ID
   * @returns Promise<void>
   */
  deleteEvent: (id: string) => Promise<void>;

  /**
   * 设置选中日期
   * @param date - 日期
   */
  setSelectedDate: (date: Date) => void;

  /**
   * 设置当前视图
   * @param view - 视图类型
   */
  setCurrentView: (view: 'month' | 'week' | 'day') => void;

  /**
   * 获取某一天的日程
   * @param date - 日期
   * @returns Event[] - 该日期的所有日程
   */
  getEventsForDate: (date: Date) => Event[];
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  selectedDate: new Date(),
  currentView: 'month',
  isLoading: false,

  loadEvents: async (startDate: Date, endDate: Date) => {
    set({ isLoading: true });
    try {
      const dao = getEventDAO();
      const newEvents = await dao.getEvents(startDate, endDate);
      
      // 合并事件数据，避免覆盖其他时间段的事件
      set(state => {
        const existingEvents = state.events;
        const mergedEvents = [...existingEvents];
        
        // 去重：如果新事件已存在，则替换；否则添加
        newEvents.forEach(newEvent => {
          const existingIndex = mergedEvents.findIndex(e => e.id === newEvent.id);
          if (existingIndex >= 0) {
            mergedEvents[existingIndex] = newEvent;
          } else {
            mergedEvents.push(newEvent);
          }
        });
        
        return { events: mergedEvents, isLoading: false };
      });
    } catch (error) {
      console.error('Failed to load events:', error);
      set({ isLoading: false });
    }
  },

  addEvent: async (
    event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>,
    reminderMinutes?: number[]
  ) => {
    try {
      const dao = getEventDAO();
      const newEvent = await dao.addEvent(event);
      
      // 创建提醒
      if (reminderMinutes && reminderMinutes.length > 0) {
        try {
          await ReminderService.createReminders(newEvent, reminderMinutes);
          console.log(`Created ${reminderMinutes.length} reminders for event:`, newEvent.id);
        } catch (error) {
          console.error('Failed to create reminders:', error);
          // 不阻断日程创建
        }
      }
      
      set(state => ({ events: [...state.events, newEvent] }));
      return newEvent;
    } catch (error) {
      console.error('Failed to add event:', error);
      throw error;
    }
  },

  updateEvent: async (id: string, updates: Partial<Event>) => {
    try {
      const dao = getEventDAO();
      await dao.updateEvent(id, updates);
      set(state => ({
        events: state.events.map(event =>
          event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event
        ),
      }));
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  },

  deleteEvent: async (id: string) => {
    try {
      // 先删除提醒
      try {
        await ReminderService.deleteEventReminders(id);
      } catch (error) {
        console.error('Failed to delete reminders:', error);
        // 继续删除日程
      }
      
      // 删除日程
      const dao = getEventDAO();
      await dao.deleteEvent(id);
      set(state => ({
        events: state.events.filter(event => event.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  },

  setSelectedDate: (date: Date) => set({ selectedDate: date }),

  setCurrentView: (view: 'month' | 'week' | 'day') => set({ currentView: view }),

  getEventsForDate: (date: Date) => {
    const { events } = get();
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  },
}));
