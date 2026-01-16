/**
 * 数据库服务层
 * 负责数据库连接管理、表创建、初始化
 */
import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

// 开启调试模式
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const DATABASE_NAME = 'CalendarApp.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAY_NAME = 'Calendar Application Database';

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLiteDatabase | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 初始化数据库连接
   */
  async init(): Promise<void> {
    try {
      if (this.db) {
        console.log('Database already initialized');
        return;
      }

      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      console.log('Database opened successfully');

      // 创建数据表
      await this.createTables();

      // 创建索引
      await this.createIndexes();

      // 创建默认日历
      await this.createDefaultCalendar();

      console.log('Database initialization completed');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * 创建数据表
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 创建 calendars 表
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS calendars (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT DEFAULT '#FF6B6B',
          isDefault INTEGER DEFAULT 0,
          isSubscribed INTEGER DEFAULT 0,
          subscriptionUrl TEXT,
          lastSyncTime INTEGER,
          createdAt INTEGER NOT NULL
        );
      `);

      // 创建 events 表
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          location TEXT,
          startTime INTEGER NOT NULL,
          endTime INTEGER NOT NULL,
          isAllDay INTEGER DEFAULT 0,
          color TEXT DEFAULT '#FF6B6B',
          calendarId TEXT DEFAULT 'default',
          rrule TEXT,
          isLunar INTEGER DEFAULT 0,
          parentEventId TEXT,
          exceptionDates TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          FOREIGN KEY (parentEventId) REFERENCES events(id) ON DELETE CASCADE
        );
      `);

      // 创建 reminders 表
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS reminders (
          id TEXT PRIMARY KEY,
          eventId TEXT NOT NULL,
          triggerTime INTEGER NOT NULL,
          method TEXT DEFAULT 'notification',
          status TEXT DEFAULT 'pending',
          notificationId TEXT,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
        );
      `);

      console.log('Tables created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  /**
   * 创建索引
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_events_startTime ON events(startTime);
      `);

      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_events_calendarId ON events(calendarId);
      `);

      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_reminders_eventId ON reminders(eventId);
      `);

      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_reminders_triggerTime ON reminders(triggerTime);
      `);

      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
      `);

      console.log('Indexes created successfully');
    } catch (error) {
      console.error('Failed to create indexes:', error);
      throw error;
    }
  }

  /**
   * 创建默认日历
   */
  private async createDefaultCalendar(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 检查是否已存在默认日历
      const result = await this.db.executeSql(
        'SELECT id FROM calendars WHERE id = ?',
        ['default']
      );

      if (result[0].rows.length === 0) {
        // 创建默认日历
        await this.db.executeSql(
          `INSERT INTO calendars (id, name, color, isDefault, createdAt)
           VALUES (?, ?, ?, ?, ?)`,
          ['default', '我的日历', '#FF6B6B', 1, Date.now()]
        );
        console.log('Default calendar created');
      }
    } catch (error) {
      console.error('Failed to create default calendar:', error);
      throw error;
    }
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('Database closed');
    }
  }
}

export default DatabaseService.getInstance();
