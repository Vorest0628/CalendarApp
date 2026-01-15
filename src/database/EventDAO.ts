/**
 * 日程数据访问对象
 * 封装所有日程相关的数据库 CRUD 操作
 */
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import DatabaseService from './DatabaseService';
import { Event } from '../types/event';
import { v4 as uuidv4 } from 'uuid';

export class EventDAO {
  private db: SQLiteDatabase;

  constructor() {
    this.db = DatabaseService.getDatabase();
  }

  /**
   * 添加日程
   * @param event - 日程对象（不含 id、createdAt、updatedAt）
   * @returns Promise<Event> - 完整的日程对象
   */
  async addEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    try {
      const id = uuidv4();
      const now = Date.now();

      await this.db.executeSql(
        `INSERT INTO events (
          id, title, description, location, startTime, endTime, 
          isAllDay, color, calendarId, rrule, isLunar, 
          parentEventId, exceptionDates, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          event.title,
          event.description || null,
          event.location || null,
          event.startTime.getTime(),
          event.endTime.getTime(),
          event.isAllDay ? 1 : 0,
          event.color,
          event.calendarId || 'default',
          event.rrule || null,
          event.isLunar ? 1 : 0,
          event.parentEventId || null,
          event.exceptionDates ? JSON.stringify(event.exceptionDates) : null,
          now,
          now,
        ]
      );

      return {
        ...event,
        id,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    } catch (error) {
      console.error('Failed to add event:', error);
      throw error;
    }
  }

  /**
   * 更新日程
   * @param id - 日程 ID
   * @param updates - 要更新的字段（部分更新）
   * @returns Promise<void>
   */
  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      // 构建更新字段
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description || null);
      }
      if (updates.location !== undefined) {
        fields.push('location = ?');
        values.push(updates.location || null);
      }
      if (updates.startTime !== undefined) {
        fields.push('startTime = ?');
        values.push(updates.startTime.getTime());
      }
      if (updates.endTime !== undefined) {
        fields.push('endTime = ?');
        values.push(updates.endTime.getTime());
      }
      if (updates.isAllDay !== undefined) {
        fields.push('isAllDay = ?');
        values.push(updates.isAllDay ? 1 : 0);
      }
      if (updates.color !== undefined) {
        fields.push('color = ?');
        values.push(updates.color);
      }
      if (updates.calendarId !== undefined) {
        fields.push('calendarId = ?');
        values.push(updates.calendarId);
      }
      if (updates.rrule !== undefined) {
        fields.push('rrule = ?');
        values.push(updates.rrule || null);
      }
      if (updates.isLunar !== undefined) {
        fields.push('isLunar = ?');
        values.push(updates.isLunar ? 1 : 0);
      }
      if (updates.exceptionDates !== undefined) {
        fields.push('exceptionDates = ?');
        values.push(updates.exceptionDates ? JSON.stringify(updates.exceptionDates) : null);
      }

      // 更新时间戳
      fields.push('updatedAt = ?');
      values.push(Date.now());

      // 添加 WHERE 条件的 id
      values.push(id);

      const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = ?`;
      await this.db.executeSql(sql, values);
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  /**
   * 删除日程
   * @param id - 日程 ID
   * @returns Promise<void>
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      await this.db.executeSql('DELETE FROM events WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  /**
   * 根据 ID 获取日程
   * @param id - 日程 ID
   * @returns Promise<Event | null>
   */
  async getEventById(id: string): Promise<Event | null> {
    try {
      const result = await this.db.executeSql(
        'SELECT * FROM events WHERE id = ?',
        [id]
      );

      if (result[0].rows.length > 0) {
        return this.mapRowToEvent(result[0].rows.item(0));
      }
      return null;
    } catch (error) {
      console.error('Failed to get event by id:', error);
      throw error;
    }
  }

  /**
   * 获取日期范围内的日程
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns Promise<Event[]>
   */
  async getEvents(startDate: Date, endDate: Date): Promise<Event[]> {
    try {
      const result = await this.db.executeSql(
        `SELECT * FROM events 
         WHERE startTime >= ? AND startTime <= ?
         ORDER BY startTime ASC`,
        [startDate.getTime(), endDate.getTime()]
      );

      const events: Event[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        events.push(this.mapRowToEvent(result[0].rows.item(i)));
      }
      return events;
    } catch (error) {
      console.error('Failed to get events:', error);
      throw error;
    }
  }

  /**
   * 获取某一天的所有日程
   * @param date - 日期
   * @returns Promise<Event[]>
   */
  async getEventsForDay(date: Date): Promise<Event[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return this.getEvents(startOfDay, endOfDay);
    } catch (error) {
      console.error('Failed to get events for day:', error);
      throw error;
    }
  }

  /**
   * 搜索日程
   * @param keyword - 搜索关键词
   * @returns Promise<Event[]> - 最多返回 50 条结果
   */
  async searchEvents(keyword: string): Promise<Event[]> {
    try {
      const searchPattern = `%${keyword}%`;
      const result = await this.db.executeSql(
        `SELECT * FROM events 
         WHERE title LIKE ? OR description LIKE ? OR location LIKE ?
         ORDER BY startTime DESC
         LIMIT 50`,
        [searchPattern, searchPattern, searchPattern]
      );

      const events: Event[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        events.push(this.mapRowToEvent(result[0].rows.item(i)));
      }
      return events;
    } catch (error) {
      console.error('Failed to search events:', error);
      throw error;
    }
  }

  /**
   * 将数据库行映射为 Event 对象
   * @param row - 数据库查询结果行
   * @returns Event
   */
  private mapRowToEvent(row: any): Event {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      startTime: new Date(row.startTime),
      endTime: new Date(row.endTime),
      isAllDay: row.isAllDay === 1,
      color: row.color,
      calendarId: row.calendarId,
      rrule: row.rrule,
      isLunar: row.isLunar === 1,
      parentEventId: row.parentEventId,
      exceptionDates: row.exceptionDates ? JSON.parse(row.exceptionDates) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
