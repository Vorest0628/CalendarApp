/**
 * 导航参数类型定义
 */
export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  EventList: { date?: string };
  EventDetail: { eventId: string };
  Settings: undefined;
};
