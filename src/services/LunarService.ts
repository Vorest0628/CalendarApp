/**
 * 农历服务
 * 封装 lunar-javascript 库的调用，提供农历转换、节气查询、节日判断等能力
 */
import { Solar, Lunar, LunarMonth, JieQi } from 'lunar-javascript';
import {
  LunarDate,
  SolarTerm,
  Festival,
  FullDateInfo,
  FestivalType,
  TRADITIONAL_FESTIVALS,
  SOLAR_TERMS,
  JIE_TERMS,
} from '../types/lunar';
import dayjs from 'dayjs';

/**
 * 农历服务类
 */
class LunarService {
  // 缓存，避免重复计算
  private cache: Map<string, FullDateInfo> = new Map();

  /**
   * 获取缓存 key
   */
  private getCacheKey(date: Date): string {
    return dayjs(date).format('YYYY-MM-DD');
  }

  /**
   * 公历转农历
   * @param date - 公历日期
   * @returns 农历日期信息
   */
  solarToLunar(date: Date): LunarDate {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();

    return {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      yearCn: lunar.getYearInChinese(),
      monthCn: lunar.getMonthInChinese() + '月',
      dayCn: lunar.getDayInChinese(),
      isLeapMonth: lunar.getMonth() < 0, // 负数表示闰月
      yearGanZhi: lunar.getYearInGanZhi(),
      monthGanZhi: lunar.getMonthInGanZhi(),
      dayGanZhi: lunar.getDayInGanZhi(),
      zodiac: lunar.getYearShengXiao(),
    };
  }

  /**
   * 农历转公历
   * @param year - 农历年
   * @param month - 农历月（1-12）
   * @param day - 农历日（1-30）
   * @param isLeapMonth - 是否闰月
   * @returns 公历日期
   */
  lunarToSolar(year: number, month: number, day: number, isLeapMonth: boolean = false): Date {
    // lunar-javascript 中闰月用负数表示
    const lunarMonth = isLeapMonth ? -month : month;
    const lunar = Lunar.fromYmd(year, lunarMonth, day);
    const solar = lunar.getSolar();
    return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
  }

  /**
   * 获取指定日期的节气（若当日是节气）
   * @param date - 公历日期
   * @returns 节气信息，若非节气日则返回 undefined
   */
  getSolarTerm(date: Date): SolarTerm | undefined {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    const jieQi = lunar.getJieQi();

    if (jieQi) {
      return {
        name: jieQi,
        date: date,
        jieOrQi: JIE_TERMS.includes(jieQi) ? 'jie' : 'qi',
      };
    }
    return undefined;
  }

  /**
   * 获取指定月份的所有节气
   * @param year - 公历年
   * @param month - 公历月（1-12）
   * @returns 该月的节气列表（通常2个）
   */
  getMonthSolarTerms(year: number, month: number): SolarTerm[] {
    const result: SolarTerm[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const solarTerm = this.getSolarTerm(date);
      if (solarTerm) {
        result.push(solarTerm);
      }
    }

    return result;
  }

  /**
   * 获取指定日期的节日列表
   * @param date - 公历日期
   * @returns 节日列表（可能包含多个节日）
   */
  getFestivals(date: Date): Festival[] {
    const festivals: Festival[] = [];
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();

    // 获取农历日期
    const lunarMonth = Math.abs(lunar.getMonth());
    const lunarDay = lunar.getDay();
    const isLeapMonth = lunar.getMonth() < 0;

    // 检查传统农历节日
    for (const festival of TRADITIONAL_FESTIVALS) {
      if (festival.month === lunarMonth && festival.day === lunarDay && !isLeapMonth) {
        // 特殊处理除夕
        if (festival.name === '除夕') {
          const monthDays = this.getLunarMonthDays(lunar.getYear(), 12, false);
          if (lunarDay === monthDays) {
            festivals.push({
              name: festival.name,
              type: FestivalType.TRADITIONAL,
              isLunar: true,
            });
          }
        } else {
          festivals.push({
            name: festival.name,
            type: FestivalType.TRADITIONAL,
            isLunar: true,
          });
        }
      }
    }

    // 检查节气节日（清明、冬至等作为节日）
    const solarTerm = this.getSolarTerm(date);
    if (solarTerm && ['清明', '冬至'].includes(solarTerm.name)) {
      festivals.push({
        name: solarTerm.name,
        type: FestivalType.SOLAR_TERM,
        isLunar: false,
      });
    }

    // 检查公历节日
    const solarMonth = date.getMonth() + 1;
    const solarDay = date.getDate();

    const modernFestivals: { month: number; day: number; name: string }[] = [
      { month: 1, day: 1, name: '元旦' },
      { month: 5, day: 1, name: '劳动节' },
      { month: 10, day: 1, name: '国庆节' },
    ];

    for (const mf of modernFestivals) {
      if (mf.month === solarMonth && mf.day === solarDay) {
        festivals.push({
          name: mf.name,
          type: FestivalType.MODERN,
          isLunar: false,
        });
      }
    }

    return festivals;
  }

  /**
   * 获取完整的日期信息（公历+农历+节气+节日）
   * @param date - 公历日期
   * @returns 完整日期信息
   */
  getFullDateInfo(date: Date): FullDateInfo {
    const cacheKey = this.getCacheKey(date);

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const lunar = this.solarToLunar(date);
    const solarTerm = this.getSolarTerm(date);
    const festivals = this.getFestivals(date);

    const info: FullDateInfo = {
      solar: date,
      lunar,
      solarTerm,
      festivals,
    };

    // 存入缓存
    this.cache.set(cacheKey, info);

    return info;
  }

  /**
   * 批量获取日期信息（用于月视图优化）
   * @param dates - 公历日期数组
   * @returns 日期信息 Map，key 为日期字符串（YYYY-MM-DD）
   */
  batchGetDateInfo(dates: Date[]): Map<string, FullDateInfo> {
    const result = new Map<string, FullDateInfo>();

    for (const date of dates) {
      const key = this.getCacheKey(date);
      result.set(key, this.getFullDateInfo(date));
    }

    return result;
  }

  /**
   * 获取农历月天数
   * @param year - 农历年
   * @param month - 农历月
   * @param isLeapMonth - 是否闰月
   * @returns 该月天数（29或30）
   */
  getLunarMonthDays(year: number, month: number, isLeapMonth: boolean = false): number {
    const lunarMonth = LunarMonth.fromYm(year, isLeapMonth ? -month : month);
    return lunarMonth ? lunarMonth.getDayCount() : 30;
  }

  /**
   * 获取某年的闰月信息
   * @param year - 农历年
   * @returns 闰月月份（1-12），若无闰月则返回 0
   */
  getLeapMonth(year: number): number {
    const lunar = Lunar.fromYmd(year, 1, 1);
    const leapMonth = lunar.getYear() === year ? this.getLeapMonthOfYear(year) : 0;
    return leapMonth;
  }

  /**
   * 内部方法：获取某年的闰月
   */
  private getLeapMonthOfYear(year: number): number {
    // 遍历 12 个月，查找是否存在闰月
    for (let m = 1; m <= 12; m++) {
      const lunarMonth = LunarMonth.fromYm(year, -m);
      if (lunarMonth) {
        return m;
      }
    }
    return 0;
  }

  /**
   * 格式化农历日期为显示字符串
   * @param lunar - 农历日期信息
   * @param format - 格式类型
   * @returns 格式化后的字符串
   */
  formatLunarDate(lunar: LunarDate, format: 'short' | 'full' = 'short'): string {
    if (format === 'short') {
      // 短格式：初一显示月份，其他显示日
      if (lunar.dayCn === '初一') {
        return lunar.isLeapMonth ? `闰${lunar.monthCn}` : lunar.monthCn;
      }
      return lunar.dayCn;
    }

    // 完整格式
    const monthStr = lunar.isLeapMonth ? `闰${lunar.monthCn}` : lunar.monthCn;
    return `${lunar.yearGanZhi}年 ${monthStr}${lunar.dayCn}`;
  }

  /**
   * 计算下一个农历日期对应的公历日期（用于农历重复日程）
   * @param baseSolarDate - 基准公历日期
   * @param count - 往后推算几个农历周期
   * @param repeatType - 重复类型（'year' | 'month'）
   * @returns 下一个公历日期
   */
  getNextLunarOccurrence(
    baseSolarDate: Date,
    count: number,
    repeatType: 'year' | 'month'
  ): Date {
    const baseLunar = this.solarToLunar(baseSolarDate);

    if (repeatType === 'year') {
      // 农历年重复
      const targetYear = baseLunar.year + count;
      // 检查目标年份的目标月份是否存在
      const targetMonth = baseLunar.month;
      const targetDay = baseLunar.day;

      // 获取目标月份的天数
      const monthDays = this.getLunarMonthDays(targetYear, targetMonth, baseLunar.isLeapMonth);
      const actualDay = Math.min(targetDay, monthDays);

      return this.lunarToSolar(targetYear, targetMonth, actualDay, baseLunar.isLeapMonth);
    } else {
      // 农历月重复
      let targetYear = baseLunar.year;
      let targetMonth = baseLunar.month + count;

      // 处理月份溢出
      while (targetMonth > 12) {
        targetMonth -= 12;
        targetYear += 1;
      }
      while (targetMonth < 1) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const targetDay = baseLunar.day;
      const monthDays = this.getLunarMonthDays(targetYear, targetMonth, false);
      const actualDay = Math.min(targetDay, monthDays);

      return this.lunarToSolar(targetYear, targetMonth, actualDay, false);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取农历年份列表（用于选择器）
   * @param minYear - 最小年份
   * @param maxYear - 最大年份
   * @returns 年份列表
   */
  getLunarYearList(minYear: number, maxYear: number): { value: number; label: string }[] {
    const list: { value: number; label: string }[] = [];
    for (let year = minYear; year <= maxYear; year++) {
      const lunar = Lunar.fromYmd(year, 1, 1);
      list.push({
        value: year,
        label: `${year} (${lunar.getYearInGanZhi()}年)`,
      });
    }
    return list;
  }

  /**
   * 获取农历月份列表（用于选择器）
   * @param year - 农历年
   * @returns 月份列表（含闰月）
   */
  getLunarMonthList(year: number): { value: number; label: string; isLeap: boolean }[] {
    const list: { value: number; label: string; isLeap: boolean }[] = [];
    const leapMonth = this.getLeapMonth(year);

    const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月',
                        '七月', '八月', '九月', '十月', '冬月', '腊月'];

    for (let month = 1; month <= 12; month++) {
      list.push({
        value: month,
        label: monthNames[month - 1],
        isLeap: false,
      });

      // 如果有闰月，添加闰月
      if (leapMonth === month) {
        list.push({
          value: month,
          label: `闰${monthNames[month - 1]}`,
          isLeap: true,
        });
      }
    }

    return list;
  }

  /**
   * 获取农历日期列表（用于选择器）
   * @param year - 农历年
   * @param month - 农历月
   * @param isLeapMonth - 是否闰月
   * @returns 日期列表
   */
  getLunarDayList(year: number, month: number, isLeapMonth: boolean): { value: number; label: string }[] {
    const list: { value: number; label: string }[] = [];
    const days = this.getLunarMonthDays(year, month, isLeapMonth);

    const dayNames = [
      '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
    ];

    for (let day = 1; day <= days; day++) {
      list.push({
        value: day,
        label: dayNames[day - 1],
      });
    }

    return list;
  }
}

export default new LunarService();
