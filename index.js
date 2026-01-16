/**
 * @format
 */

import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';

// 注册后台事件处理（应用关闭时也能处理通知）
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.PRESS) {
    // 处理通知点击
    console.log('后台通知被点击:', notification?.id);
    // 可以在这里保存状态，等应用启动后跳转
  }

  if (type === EventType.ACTION_PRESS) {
    // 处理操作按钮点击（如延后、忽略）
    console.log('操作按钮点击:', pressAction?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
