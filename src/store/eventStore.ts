import { create } from 'zustand';
import { Event } from '../types/event';
import { EventDAO } from '../database/EventDAO';

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
   * @returns Promise<void>
   */
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  /**
   * 更新日程
   * @param id - 日程 ID
   * @param updates - 要更新的字段
   * @returns Promise<void>
   */
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;

  /**
   * 删除日程
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
      const events = await dao.getEvents(startDate, endDate);
      set({ events, isLoading: false });
    } catch (error) {
      console.error('Failed to load events:', error);
      set({ isLoading: false });
    }
  },

  addEvent: async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const dao = getEventDAO();
      const newEvent = await dao.addEvent(event);
      set(state => ({ events: [...state.events, newEvent] }));
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
