/**
 * 农历相关类型定义
 */

/**
 * 农历日期信息
 */
export interface LunarDate {
  year: number;                   // 农历年（数字）
  month: number;                  // 农历月（1-12）
  day: number;                    // 农历日（1-30）
  yearCn: string;                 // 农历年（中文，如"二〇二六"）
  monthCn: string;                // 农历月（中文，如"正月"、"闰二月"）
  dayCn: string;                  // 农历日（中文，如"初一"、"十五"）
  isLeapMonth: boolean;           // 是否闰月
  yearGanZhi: string;             // 年干支（如"丙午"）
  monthGanZhi: string;            // 月干支
  dayGanZhi: string;              // 日干支
  zodiac: string;                 // 生肖（如"马"）
}

/**
 * 节气信息
 */
export interface SolarTerm {
  name: string;                   // 节气名称（如"立春"、"雨水"）
  date: Date;                     // 公历日期
  jieOrQi: 'jie' | 'qi';          // 节或气
}

/**
 * 节日信息
 */
export interface Festival {
  name: string;                   // 节日名称
  type: FestivalType;             // 节日类型
  isLunar: boolean;               // 是否农历节日
}

/**
 * 节日类型枚举
 */
export enum FestivalType {
  TRADITIONAL = 'traditional',    // 传统节日（春节、中秋等）
  SOLAR_TERM = 'solar_term',      // 节气节日（清明、冬至等）
  MODERN = 'modern',              // 现代节日（国庆、劳动节等）
  MEMORIAL = 'memorial',          // 纪念日
}

/**
 * 完整的日期信息（公历+农历+节气+节日）
 */
export interface FullDateInfo {
  solar: Date;                    // 公历日期
  lunar: LunarDate;               // 农历信息
  solarTerm?: SolarTerm;          // 当日节气（若有）
  festivals: Festival[];          // 当日节日列表
}

/**
 * 传统节日列表（农历）
 */
export const TRADITIONAL_FESTIVALS: { month: number; day: number; name: string; isLeap?: boolean }[] = [
  { month: 1, day: 1, name: '春节' },
  { month: 1, day: 15, name: '元宵节' },
  { month: 2, day: 2, name: '龙抬头' },
  { month: 5, day: 5, name: '端午节' },
  { month: 7, day: 7, name: '七夕节' },
  { month: 7, day: 15, name: '中元节' },
  { month: 8, day: 15, name: '中秋节' },
  { month: 9, day: 9, name: '重阳节' },
  { month: 12, day: 8, name: '腊八节' },
  { month: 12, day: 30, name: '除夕' },  // 特殊处理：小月则为29
];

/**
 * 二十四节气名称
 */
export const SOLAR_TERMS: string[] = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

/**
 * 节气中的"节"（用于判断节气类型）
 */
export const JIE_TERMS: string[] = [
  '小寒', '立春', '惊蛰', '清明', '立夏', '芒种',
  '小暑', '立秋', '白露', '寒露', '立冬', '大雪',
];
