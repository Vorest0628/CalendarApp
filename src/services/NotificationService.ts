/**
 * 通知服务层
 * 封装 Notifee 通知功能，提供统一的通知调度接口
 */
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
  private static instance: NotificationService;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 初始化通知服务
   * - 创建 Android 通知渠道
   * - 设置事件监听器
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Android: 创建通知渠道
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'calendar_reminders',
          name: '日程提醒',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
        console.log('Android notification channel created');
      }

      // 设置事件监听器
      this.setupEventListeners();

      this.initialized = true;
      console.log('NotificationService initialized');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
      throw error;
    }
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    try {
      await this.initialize();

      const settings = await notifee.requestPermission();
      
      const granted = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
      
      console.log('Notification permission:', granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * 检查通知权限
   */
  async checkPermission(): Promise<boolean> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    } catch (error) {
      console.error('Failed to check notification permission:', error);
      return false;
    }
  }

  /**
   * 调度定时通知
   */
  async scheduleNotification(
    id: string,
    title: string,
    body: string,
    triggerTime: Date,
    data?: any
  ): Promise<string> {
    try {
      await this.initialize();

      // 检查权限
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        throw new Error('Notification permission not granted');
      }

      // 检查触发时间
      if (triggerTime.getTime() <= Date.now()) {
        throw new Error('Trigger time must be in the future');
      }

      // 创建时间戳触发器
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime.getTime(),
      };

      // 调度通知
      const notificationId = await notifee.createTriggerNotification(
        {
          id,
          title,
          body,
          android: {
            channelId: 'calendar_reminders',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
            smallIcon: 'ic_launcher',
          },
          ios: {
            sound: 'default',
            criticalVolume: 1.0,
          },
          data: {
            ...data,
            reminderId: id,
          },
        },
        trigger
      );

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * 取消单个通知
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      throw error;
    }
  }

  /**
   * 批量取消通知
   */
  async cancelNotifications(notificationIds: string[]): Promise<void> {
    try {
      await Promise.all(
        notificationIds.map(id => notifee.cancelNotification(id))
      );
      console.log('Notifications cancelled:', notificationIds.length);
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
      throw error;
    }
  }

  /**
   * 取消所有通知
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
      throw error;
    }
  }

  /**
   * 显示即时通知（不需要调度）
   */
  async displayNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      await this.initialize();

      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: 'calendar_reminders',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
        data,
      });

      console.log('Notification displayed');
    } catch (error) {
      console.error('Failed to display notification:', error);
      throw error;
    }
  }

  /**
   * 设置应用图标角标（仅 iOS）
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await notifee.setBadgeCount(count);
        console.log('Badge count set:', count);
      }
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * 获取所有待处理的通知
   */
  async getPendingNotifications(): Promise<any[]> {
    try {
      const notifications = await notifee.getTriggerNotifications();
      return notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  /**
   * 设置前台和后台事件监听器
   */
  private setupEventListeners(): void {
    // 前台事件监听
    notifee.onForegroundEvent(({ type, detail }) => {
      const { notification, pressAction } = detail;

      if (type === EventType.PRESS) {
        console.log('Foreground notification pressed:', notification?.id);
        this.handleNotificationPress(notification?.data);
      }

      if (type === EventType.ACTION_PRESS && pressAction?.id) {
        console.log('Foreground action pressed:', pressAction.id);
        this.handleNotificationAction(pressAction.id, notification?.data);
      }

      if (type === EventType.DISMISSED) {
        console.log('Notification dismissed:', notification?.id);
      }
    });
  }

  /**
   * 处理通知点击事件
   */
  private handleNotificationPress(data: any): void {
    try {
      if (data?.eventId) {
        console.log('Navigate to event:', data.eventId);
        // 这里可以添加导航逻辑
        // 例如：NavigationService.navigate('EventDetail', { eventId: data.eventId });
      }
    } catch (error) {
      console.error('Failed to handle notification press:', error);
    }
  }

  /**
   * 处理通知操作按钮点击
   */
  private handleNotificationAction(actionId: string, data: any): void {
    try {
      switch (actionId) {
        case 'snooze':
          console.log('Snooze reminder:', data?.reminderId);
          // 延后提醒逻辑
          break;
        case 'dismiss':
          console.log('Dismiss reminder:', data?.reminderId);
          // 忽略提醒逻辑
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to handle notification action:', error);
    }
  }
}

export default NotificationService.getInstance();
