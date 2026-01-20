/**
 * lunar-javascript 库的类型声明
 */
declare module 'lunar-javascript' {
  /**
   * 公历日期类
   */
  export class Solar {
    /**
     * 从 Date 对象创建 Solar 实例
     */
    static fromDate(date: Date): Solar;

    /**
     * 从年月日创建 Solar 实例
     */
    static fromYmd(year: number, month: number, day: number): Solar;

    /**
     * 获取年份
     */
    getYear(): number;

    /**
     * 获取月份（1-12）
     */
    getMonth(): number;

    /**
     * 获取日期
     */
    getDay(): number;

    /**
     * 获取对应的农历对象
     */
    getLunar(): Lunar;

    /**
     * 转为 Date 对象
     */
    toDate(): Date;
  }

  /**
   * 农历日期类
   */
  export class Lunar {
    /**
     * 从农历年月日创建 Lunar 实例
     * 闰月用负数表示，如闰四月为 -4
     */
    static fromYmd(year: number, month: number, day: number): Lunar;

    /**
     * 获取农历年
     */
    getYear(): number;

    /**
     * 获取农历月（闰月为负数）
     */
    getMonth(): number;

    /**
     * 获取农历日
     */
    getDay(): number;

    /**
     * 获取农历年的中文表示
     */
    getYearInChinese(): string;

    /**
     * 获取农历月的中文表示
     */
    getMonthInChinese(): string;

    /**
     * 获取农历日的中文表示
     */
    getDayInChinese(): string;

    /**
     * 获取年干支
     */
    getYearInGanZhi(): string;

    /**
     * 获取月干支
     */
    getMonthInGanZhi(): string;

    /**
     * 获取日干支
     */
    getDayInGanZhi(): string;

    /**
     * 获取生肖
     */
    getYearShengXiao(): string;

    /**
     * 获取节气（如果当天是节气）
     */
    getJieQi(): string | null;

    /**
     * 获取节日列表
     */
    getFestivals(): string[];

    /**
     * 获取对应的公历对象
     */
    getSolar(): Solar;
  }

  /**
   * 农历月类
   */
  export class LunarMonth {
    /**
     * 从农历年月创建 LunarMonth 实例
     * 闰月用负数表示
     */
    static fromYm(year: number, month: number): LunarMonth | null;

    /**
     * 获取该月天数
     */
    getDayCount(): number;

    /**
     * 获取年份
     */
    getYear(): number;

    /**
     * 获取月份（闰月为负数）
     */
    getMonth(): number;
  }

  /**
   * 节气类
   */
  export class JieQi {
    /**
     * 获取节气名称
     */
    getName(): string;

    /**
     * 获取对应的公历对象
     */
    getSolar(): Solar;
  }
}
