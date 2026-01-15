/**
 * 重复规则工具
 * 处理 RFC 5545 重复规则的生成、解析、日期计算
 */
import { RRule, Frequency } from 'rrule';

/**
 * 重复规则接口
 */
export interface RepeatRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number; // 间隔（如每2天、每3周）
  count?: number; // 重复次数
  until?: Date; // 结束日期
  byWeekday?: number[]; // 星期几（0-6，0=周一）
  byMonthDay?: number[]; // 每月的第几天
}

/**
 * 频率映射
 */
const FREQUENCY_MAP: Record<string, Frequency> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
};

const FREQUENCY_REVERSE_MAP: Record<Frequency, string> = {
  [RRule.DAILY]: 'DAILY',
  [RRule.WEEKLY]: 'WEEKLY',
  [RRule.MONTHLY]: 'MONTHLY',
  [RRule.YEARLY]: 'YEARLY',
  [RRule.HOURLY]: 'HOURLY',
  [RRule.MINUTELY]: 'MINUTELY',
  [RRule.SECONDLY]: 'SECONDLY',
};

/**
 * 生成 RRULE 字符串
 * @param rule - 重复规则对象
 * @returns string - RRULE 字符串（不含 "RRULE:" 前缀）
 */
export function generateRRule(rule: RepeatRule): string {
  try {
    const options: any = {
      freq: FREQUENCY_MAP[rule.frequency],
      interval: rule.interval || 1,
    };

    // 设置结束条件
    if (rule.count) {
      options.count = rule.count;
    } else if (rule.until) {
      options.until = rule.until;
    }

    // 设置星期几
    if (rule.byWeekday && rule.byWeekday.length > 0) {
      options.byweekday = rule.byWeekday;
    }

    // 设置每月的第几天
    if (rule.byMonthDay && rule.byMonthDay.length > 0) {
      options.bymonthday = rule.byMonthDay;
    }

    const rrule = new RRule(options);
    // 返回不带 "RRULE:" 前缀的字符串
    return rrule.toString().replace('RRULE:', '');
  } catch (error) {
    console.error('Failed to generate RRULE:', error);
    throw error;
  }
}

/**
 * 解析 RRULE 字符串
 * @param rruleString - RRULE 字符串
 * @returns RepeatRule | null - 解析失败返回 null
 */
export function parseRRule(rruleString: string): RepeatRule | null {
  try {
    // 添加前缀（如果没有）
    const fullRRule = rruleString.startsWith('RRULE:')
      ? rruleString
      : `RRULE:${rruleString}`;

    const rrule = RRule.fromString(fullRRule);
    const options = rrule.options;

    const rule: RepeatRule = {
      frequency: FREQUENCY_REVERSE_MAP[options.freq] as RepeatRule['frequency'],
      interval: options.interval || 1,
    };

    if (options.count) {
      rule.count = options.count;
    }

    if (options.until) {
      rule.until = options.until;
    }

    if (options.byweekday && options.byweekday.length > 0) {
      rule.byWeekday = options.byweekday as number[];
    }

    if (options.bymonthday && options.bymonthday.length > 0) {
      rule.byMonthDay = options.bymonthday as number[];
    }

    return rule;
  } catch (error) {
    console.error('Failed to parse RRULE:', error);
    return null;
  }
}

/**
 * 根据 RRULE 生成日期列表
 * @param startDate - 开始日期
 * @param rruleString - RRULE 字符串
 * @param maxOccurrences - 最大生成数量（默认 365）
 * @returns Date[] - 日期数组
 */
export function generateOccurrences(
  startDate: Date,
  rruleString: string,
  maxOccurrences: number = 365
): Date[] {
  try {
    const fullRRule = rruleString.startsWith('RRULE:')
      ? rruleString
      : `RRULE:${rruleString}`;

    const rrule = RRule.fromString(fullRRule);
    
    // 更新开始日期
    const options = rrule.options;
    options.dtstart = startDate;

    const newRRule = new RRule(options);
    
    // 生成最多 maxOccurrences 个日期
    return newRRule.all((date, i) => i < maxOccurrences);
  } catch (error) {
    console.error('Failed to generate occurrences:', error);
    return [];
  }
}

/**
 * 获取下一个发生日期
 * @param startDate - 开始日期
 * @param rruleString - RRULE 字符串
 * @returns Date | null - 下次发生日期，无则返回 null
 */
export function getNextOccurrence(
  startDate: Date,
  rruleString: string
): Date | null {
  try {
    const fullRRule = rruleString.startsWith('RRULE:')
      ? rruleString
      : `RRULE:${rruleString}`;

    const rrule = RRule.fromString(fullRRule);
    
    // 更新开始日期
    const options = rrule.options;
    options.dtstart = startDate;

    const newRRule = new RRule(options);
    
    // 获取下一个日期（从当前时间之后）
    const now = new Date();
    const next = newRRule.after(now, true);
    
    return next || null;
  } catch (error) {
    console.error('Failed to get next occurrence:', error);
    return null;
  }
}

/**
 * 检查日期是否在重复规则中
 * @param date - 要检查的日期
 * @param startDate - 开始日期
 * @param rruleString - RRULE 字符串
 * @returns boolean - 是否在重复规则中
 */
export function isDateInRRule(
  date: Date,
  startDate: Date,
  rruleString: string
): boolean {
  try {
    const occurrences = generateOccurrences(startDate, rruleString);
    const targetTime = date.getTime();
    
    return occurrences.some(occurrence => {
      const occurrenceDate = new Date(occurrence);
      occurrenceDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return occurrenceDate.getTime() === checkDate.getTime();
    });
  } catch (error) {
    console.error('Failed to check if date is in RRULE:', error);
    return false;
  }
}

/**
 * 获取重复规则的描述文本
 * @param rule - 重复规则对象
 * @returns string - 描述文本（中文）
 */
export function getRuleDescription(rule: RepeatRule): string {
  const { frequency, interval, count, until } = rule;

  let desc = '';

  switch (frequency) {
    case 'DAILY':
      desc = interval === 1 ? '每天' : `每 ${interval} 天`;
      break;
    case 'WEEKLY':
      desc = interval === 1 ? '每周' : `每 ${interval} 周`;
      break;
    case 'MONTHLY':
      desc = interval === 1 ? '每月' : `每 ${interval} 个月`;
      break;
    case 'YEARLY':
      desc = interval === 1 ? '每年' : `每 ${interval} 年`;
      break;
  }

  if (count) {
    desc += `，共 ${count} 次`;
  } else if (until) {
    desc += `，直到 ${until.toLocaleDateString('zh-CN')}`;
  }

  return desc;
}
