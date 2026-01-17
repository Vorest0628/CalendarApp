/**
 * 提醒数据访问对象
 * 封装提醒相关的数据库操作
 */
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import DatabaseService from './DatabaseService';
import { Reminder, ReminderStatus, ReminderMethod } from '../types/event';

export class ReminderDAO {
  private db: SQLiteDatabase | null = null;

  private getDb(): SQLiteDatabase {
    if (!this.db) {
      this.db = DatabaseService.getDatabase();
    }
    return this.db;
  }

  /**
   * 添加提醒到数据库
   */
  async addReminder(reminder: Reminder): Promise<void> {
    try {
      await this.getDb().executeSql(
        `INSERT INTO reminders (id, eventId, triggerTime, method, status, notificationId, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          reminder.id,
          reminder.eventId,
          reminder.triggerTime.getTime(),
          reminder.method,
          reminder.status,
          reminder.notificationId || null,
          Date.now(),
        ]
      );
      console.log('Reminder added:', reminder.id);
    } catch (error) {
      console.error('Failed to add reminder:', error);
      throw error;
    }
  }

  /**
   * 更新提醒
   */
  async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.triggerTime !== undefined) {
        fields.push('triggerTime = ?');
        values.push(updates.triggerTime.getTime());
      }

      if (updates.method !== undefined) {
        fields.push('method = ?');
        values.push(updates.method);
      }

      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }

      if (updates.notificationId !== undefined) {
        fields.push('notificationId = ?');
        values.push(updates.notificationId);
      }

      if (fields.length === 0) {
        console.log('No fields to update');
        return;
      }

      values.push(id);

      await this.getDb().executeSql(
        `UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      console.log('Reminder updated:', id);
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }

  /**
   * 删除提醒
   */
  async deleteReminder(id: string): Promise<void> {
    try {
      await this.getDb().executeSql('DELETE FROM reminders WHERE id = ?', [id]);
      console.log('Reminder deleted:', id);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }

  /**
   * 删除日程的所有提醒（级联删除）
   */
  async deleteRemindersByEventId(eventId: string): Promise<void> {
    try {
      await this.getDb().executeSql('DELETE FROM reminders WHERE eventId = ?', [
        eventId,
      ]);
      console.log('All reminders deleted for event:', eventId);
    } catch (error) {
      console.error('Failed to delete reminders by eventId:', error);
      throw error;
    }
  }

  /**
   * 根据 ID 获取提醒
   */
  async getReminderById(id: string): Promise<Reminder | null> {
    try {
      const result = await this.getDb().executeSql(
        'SELECT * FROM reminders WHERE id = ?',
        [id]
      );

      if (result[0].rows.length === 0) {
        return null;
      }

      return this.mapRowToReminder(result[0].rows.item(0));
    } catch (error) {
      console.error('Failed to get reminder by id:', error);
      throw error;
    }
  }

  /**
   * 获取日程的所有提醒
   */
  async getRemindersByEventId(eventId: string): Promise<Reminder[]> {
    try {
      const result = await this.getDb().executeSql(
        'SELECT * FROM reminders WHERE eventId = ? ORDER BY triggerTime ASC',
        [eventId]
      );

      const reminders: Reminder[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        reminders.push(this.mapRowToReminder(result[0].rows.item(i)));
      }

      return reminders;
    } catch (error) {
      console.error('Failed to get reminders by eventId:', error);
      throw error;
    }
  }

  /**
   * 获取所有待触发的提醒
   */
  async getPendingReminders(): Promise<Reminder[]> {
    try {
      const result = await this.getDb().executeSql(
        `SELECT * FROM reminders 
         WHERE status = ? AND triggerTime > ?
         ORDER BY triggerTime ASC`,
        [ReminderStatus.PENDING, Date.now()]
      );

      const reminders: Reminder[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        reminders.push(this.mapRowToReminder(result[0].rows.item(i)));
      }

      return reminders;
    } catch (error) {
      console.error('Failed to get pending reminders:', error);
      throw error;
    }
  }

  /**
   * 将数据库行映射为 Reminder 对象
   */
  private mapRowToReminder(row: any): Reminder {
    return {
      id: row.id,
      eventId: row.eventId,
      triggerTime: new Date(row.triggerTime),
      method: row.method as ReminderMethod,
      status: row.status as ReminderStatus,
      notificationId: row.notificationId,
    };
  }
}
