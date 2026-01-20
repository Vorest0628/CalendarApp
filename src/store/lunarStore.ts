/**
 * 农历数据存储层
 * 封装农历计算逻辑，视图层通过此 store 获取农历数据
 */
import { create } from 'zustand';
import LunarService from '../services/LunarService';
import { LunarDate, FullDateInfo } from '../types/lunar';

interface LunarState {
  /**
   * 获取指定日期的完整信息（公历+农历+节气+节日）
   * @param date - 公历日期
   * @returns 完整日期信息
   */
  getFullDateInfo: (date: Date) => FullDateInfo;

  /**
   * 公历转农历
   * @param date - 公历日期
   * @returns 农历日期信息
   */
  solarToLunar: (date: Date) => LunarDate;

  /**
   * 农历转公历
   * @param year - 农历年
   * @param month - 农历月（1-12）
   * @param day - 农历日（1-30）
   * @param isLeapMonth - 是否闰月
   * @returns 公历日期
   */
  lunarToSolar: (year: number, month: number, day: number, isLeapMonth?: boolean) => Date;

  /**
   * 格式化农历日期为显示字符串
   * @param lunar - 农历日期信息
   * @param format - 格式类型 'short' | 'full'
   * @returns 格式化后的字符串
   */
  formatLunarDate: (lunar: LunarDate, format?: 'short' | 'full') => string;

  /**
   * 获取农历显示文本（优先级：节日 > 节气 > 农历日）
   * @param dateInfo - 完整日期信息
   * @param showFestivals - 是否显示节日
   * @param showSolarTerms - 是否显示节气
   * @returns 显示文本
   */
  getLunarDisplayText: (
    dateInfo: FullDateInfo,
    showFestivals: boolean,
    showSolarTerms: boolean
  ) => string;

  /**
   * 判断是否为节日日期
   * @param dateInfo - 完整日期信息
   * @returns 是否为节日
   */
  isFestivalDate: (dateInfo: FullDateInfo) => boolean;

  /**
   * 判断是否为节气日期
   * @param dateInfo - 完整日期信息
   * @returns 是否为节气
   */
  isSolarTermDate: (dateInfo: FullDateInfo) => boolean;

  /**
   * 获取农历年份列表（用于选择器）
   * @param minYear - 最小年份
   * @param maxYear - 最大年份
   * @returns 年份列表
   */
  getLunarYearList: (minYear: number, maxYear: number) => { value: number; label: string }[];

  /**
   * 获取农历月份列表（用于选择器）
   * @param year - 农历年
   * @returns 月份列表（含闰月）
   */
  getLunarMonthList: (year: number) => { value: number; label: string; isLeap: boolean }[];

  /**
   * 获取农历日期列表（用于选择器）
   * @param year - 农历年
   * @param month - 农历月
   * @param isLeapMonth - 是否闰月
   * @returns 日期列表
   */
  getLunarDayList: (year: number, month: number, isLeapMonth: boolean) => { value: number; label: string }[];

  /**
   * 获取农历月天数
   * @param year - 农历年
   * @param month - 农历月
   * @param isLeapMonth - 是否闰月
   * @returns 该月天数（29或30）
   */
  getLunarMonthDays: (year: number, month: number, isLeapMonth?: boolean) => number;

  /**
   * 清除缓存
   */
  clearCache: () => void;
}

export const useLunarStore = create<LunarState>(() => ({
  getFullDateInfo: (date: Date) => {
    return LunarService.getFullDateInfo(date);
  },

  solarToLunar: (date: Date) => {
    return LunarService.solarToLunar(date);
  },

  lunarToSolar: (year: number, month: number, day: number, isLeapMonth?: boolean) => {
    return LunarService.lunarToSolar(year, month, day, isLeapMonth);
  },

  formatLunarDate: (lunar: LunarDate, format?: 'short' | 'full') => {
    return LunarService.formatLunarDate(lunar, format);
  },

  getLunarDisplayText: (
    dateInfo: FullDateInfo,
    showFestivals: boolean,
    showSolarTerms: boolean
  ) => {
    // 节日优先
    if (showFestivals && dateInfo.festivals.length > 0) {
      return dateInfo.festivals[0].name;
    }
    // 节气其次
    if (showSolarTerms && dateInfo.solarTerm) {
      return dateInfo.solarTerm.name;
    }
    // 农历日
    return LunarService.formatLunarDate(dateInfo.lunar, 'short');
  },

  isFestivalDate: (dateInfo: FullDateInfo) => {
    return dateInfo.festivals.length > 0;
  },

  isSolarTermDate: (dateInfo: FullDateInfo) => {
    return !!dateInfo.solarTerm;
  },

  getLunarYearList: (minYear: number, maxYear: number) => {
    return LunarService.getLunarYearList(minYear, maxYear);
  },

  getLunarMonthList: (year: number) => {
    return LunarService.getLunarMonthList(year);
  },

  getLunarDayList: (year: number, month: number, isLeapMonth: boolean) => {
    return LunarService.getLunarDayList(year, month, isLeapMonth);
  },

  getLunarMonthDays: (year: number, month: number, isLeapMonth?: boolean) => {
    return LunarService.getLunarMonthDays(year, month, isLeapMonth);
  },

  clearCache: () => {
    LunarService.clearCache();
  },
}));
