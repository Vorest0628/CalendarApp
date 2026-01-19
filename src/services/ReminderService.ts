/**
 * 提醒业务逻辑服务
 * 管理提醒的创建、更新、删除
 */
import {
  Reminder,
  ReminderMethod,
  ReminderStatus,
  Event,
} from '../types/event';
import { ReminderDAO } from '../database/ReminderDAO';
import { EventDAO } from '../database/EventDAO';
import NotificationService from './NotificationService';
import { v4 as uuidv4 } from 'uuid';

class ReminderService {
  private static instance: ReminderService;
  private reminderDAO: ReminderDAO;
  private eventDAO: EventDAO;

  private constructor() {
    this.reminderDAO = new ReminderDAO();
    this.eventDAO = new EventDAO();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  /**
   * 为日程创建单个提醒
   */
  async createReminder(
    event: Event,
    minutesBefore: number,
    method: ReminderMethod = ReminderMethod.NOTIFICATION
  ): Promise<Reminder> {
    try {
      // 计算触发时间
      const triggerTime = new Date(
        event.startTime.getTime() - minutesBefore * 60 * 1000
      );

      // 检查触发时间是否已过（给予 30 秒缓冲）
      const now = Date.now();
      if (triggerTime.getTime() <= now + 30000) {
        console.warn(`Trigger time is too close or in the past, skipping reminder for event: ${event.id}`);
        throw new Error('Trigger time must be at least 30 seconds in the future');
      }

      // 创建提醒对象
      const reminder: Reminder = {
        id: uuidv4(),
        eventId: event.id,
        triggerTime,
        method,
        status: ReminderStatus.PENDING,
      };

      // 调度系统通知
      if (method === ReminderMethod.NOTIFICATION) {
        const notificationId =
          await NotificationService.scheduleNotificationWithSettings(
            reminder.id,
            event.title,
            this.formatNotificationBody(event, minutesBefore),
            triggerTime,
            {
              eventId: event.id,
              reminderId: reminder.id,
            }
          );
        if (notificationId) {
          reminder.notificationId = notificationId;
        }
      }

      // 保存到数据库
      await this.reminderDAO.addReminder(reminder);

      return reminder;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  }

  /**
   * 批量创建提醒
   */
  async createReminders(
    event: Event,
    minutesBeforeList: number[]
  ): Promise<Reminder[]> {
    try {
      const reminders: Reminder[] = [];

      for (const minutes of minutesBeforeList) {
        try {
          const reminder = await this.createReminder(event, minutes);
          reminders.push(reminder);
        } catch (error) {
          console.error(`Failed to create reminder ${minutes}min before:`, error);
          // 继续创建其他提醒
        }
      }

      console.log(`Created ${reminders.length} reminders for event:`, event.id);
      return reminders;
    } catch (error) {
      console.error('Failed to create reminders:', error);
      throw error;
    }
  }

  /**
   * 更新提醒
   */
  async updateReminder(
    reminderId: string,
    updates: Partial<Reminder>
  ): Promise<void> {
    try {
      const reminder = await this.reminderDAO.getReminderById(reminderId);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      // 如果更新触发时间，需要重新调度通知
      if (updates.triggerTime && reminder.notificationId) {
        await NotificationService.cancelNotification(reminder.notificationId);

        const event = await this.getEventByReminder(reminder);
        if (event) {
          const notificationId = await NotificationService.scheduleNotification(
            reminder.id,
            event.title,
            this.formatNotificationBody(
              event,
              (event.startTime.getTime() - updates.triggerTime.getTime()) /
                60000
            ),
            updates.triggerTime,
            {
              eventId: event.id,
              reminderId: reminder.id,
            }
          );
          updates.notificationId = notificationId;
        }
      }

      await this.reminderDAO.updateReminder(reminderId, updates);
      console.log('Reminder updated:', reminderId);
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }

  /**
   * 删除单个提醒
   */
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const reminder = await this.reminderDAO.getReminderById(reminderId);
      if (!reminder) {
        console.log('Reminder not found:', reminderId);
        return;
      }

      // 取消系统通知
      if (reminder.notificationId) {
        await NotificationService.cancelNotification(reminder.notificationId);
      }

      // 从数据库删除
      await this.reminderDAO.deleteReminder(reminderId);
      console.log('Reminder deleted:', reminderId);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }

  /**
   * 删除日程的所有提醒
   */
  async deleteEventReminders(eventId: string): Promise<void> {
    try {
      // 获取所有提醒
      const reminders = await this.reminderDAO.getRemindersByEventId(eventId);

      // 取消所有系统通知
      const notificationIds = reminders
        .map(r => r.notificationId)
        .filter((id): id is string => !!id);

      if (notificationIds.length > 0) {
        await NotificationService.cancelNotifications(notificationIds);
      }

      // 从数据库删除
      await this.reminderDAO.deleteRemindersByEventId(eventId);
      console.log('All reminders deleted for event:', eventId);
    } catch (error) {
      console.error('Failed to delete event reminders:', error);
      throw error;
    }
  }

  /**
   * 延后提醒
   */
  async snoozeReminder(
    reminderId: string,
    minutes: number = 5
  ): Promise<void> {
    try {
      const reminder = await this.reminderDAO.getReminderById(reminderId);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      // 计算新的触发时间
      const newTriggerTime = new Date(Date.now() + minutes * 60 * 1000);

      // 更新提醒
      await this.updateReminder(reminderId, {
        triggerTime: newTriggerTime,
        status: ReminderStatus.SNOOZED,
      });

      console.log(`Reminder snoozed for ${minutes} minutes:`, reminderId);
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
      throw error;
    }
  }

  /**
   * 标记提醒为已发送
   */
  async markAsSent(reminderId: string): Promise<void> {
    try {
      await this.reminderDAO.updateReminder(reminderId, {
        status: ReminderStatus.SENT,
      });
      console.log('Reminder marked as sent:', reminderId);
    } catch (error) {
      console.error('Failed to mark reminder as sent:', error);
      throw error;
    }
  }

  /**
   * 标记提醒为已忽略
   */
  async markAsDismissed(reminderId: string): Promise<void> {
    try {
      await this.reminderDAO.updateReminder(reminderId, {
        status: ReminderStatus.DISMISSED,
      });
      console.log('Reminder marked as dismissed:', reminderId);
    } catch (error) {
      console.error('Failed to mark reminder as dismissed:', error);
      throw error;
    }
  }

  /**
   * 获取日程的所有提醒
   */
  async getEventReminders(eventId: string): Promise<Reminder[]> {
    try {
      return await this.reminderDAO.getRemindersByEventId(eventId);
    } catch (error) {
      console.error('Failed to get event reminders:', error);
      throw error;
    }
  }

  /**
   * 获取所有待触发的提醒
   */
  async getPendingReminders(): Promise<Reminder[]> {
    try {
      return await this.reminderDAO.getPendingReminders();
    } catch (error) {
      console.error('Failed to get pending reminders:', error);
      throw error;
    }
  }

  /**
   * 格式化通知内容
   */
  private formatNotificationBody(event: Event, minutesBefore: number): string {
    const startTime = event.startTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (minutesBefore === 0) {
      return `现在开始 · ${startTime}`;
    } else if (minutesBefore < 60) {
      return `${minutesBefore}分钟后开始 · ${startTime}`;
    } else if (minutesBefore < 1440) {
      const hours = Math.floor(minutesBefore / 60);
      return `${hours}小时后开始 · ${startTime}`;
    } else {
      const days = Math.floor(minutesBefore / 1440);
      return `${days}天后开始 · ${startTime}`;
    }
  }

  /**
   * 根据提醒获取对应的日程
   */
  private async getEventByReminder(reminder: Reminder): Promise<Event | null> {
    try {
      return await this.eventDAO.getEventById(reminder.eventId);
    } catch (error) {
      console.error('Failed to get event by reminder:', error);
      return null;
    }
  }
}

export default ReminderService.getInstance();
