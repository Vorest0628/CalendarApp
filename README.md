# 📅 CalendarApp

**前言**: 本项目为腾讯营地大前端项目大作业

一款功能完善的跨平台日历应用，基于 React Native 开发，支持 Android、iOS 平台。完全遵循 [RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545) iCalendar 标准，实现了日程管理、智能提醒、农历支持等核心功能。

## ✨ 功能特性

### 核心功能（已实现）

- **📅 多视图展示**
  - 月视图 - 完整月份日历网格展示，支持左右滑动切换
  - 周视图 - 按周展示时间轴，支持左右滑动切换
  - 日视图 - 单日详细时间轴展示（00:00-23:59）
  - 流畅的视图切换动画与手势操作
  - 优化的懒加载机制，滑动流畅不卡顿

- **📝 日程管理**
  - 创建、编辑、删除日程
  - 支持全天事件和时间段事件
  - 颜色标签分类（8种颜色）
  - 地点和描述信息
  - 重复日程设置（基于 RRULE 标准）
    - 每天、每周、每月、每年重复
    - 自定义重复规则
    - 按星期、按日期重复
    - 设置重复次数或结束日期
  - 完善的日程详情展示

- **🔔 智能提醒**
  - 多种提醒时间选项
    - 事件时提醒
    - 提前 5/10/15/30 分钟
    - 提前 1/2/3/12/24 小时
    - 提前 1/2 天
    - 提前 1 周
  - 本地推送通知（基于 Notifee）
  - 支持同时设置多个提醒
  - 提醒通知管理
  - 完善的权限处理

- **🏮 农历支持**
  - 月视图显示农历日期
  - 节气标注（二十四节气）
  - 传统节日显示（春节、端午、中秋等）
  - 支持农历日程创建
  - 农历日期选择器（支持闰月）
  - 干支纪年、生肖显示

- **⚙️ 应用设置**
  - 主题切换（浅色/深色/跟随系统）
  - 默认提醒时间设置
  - 周起始日设置（周日/周一）
  - 通知总开关
  - 农历显示开关
  - 节气显示开关
  - 传统节日显示开关
  - 数据管理（清除缓存/重置应用）

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React Native** | 0.83.1 | 跨平台移动应用框架 |
| **TypeScript** | 5.8.3 | 类型安全的 JavaScript 超集 |
| **React Navigation** | 7.0+ | 路由和导航管理 |
| **Zustand** | 5.0.9 | 轻量级状态管理 |
| **Day.js** | 1.11.19 | 日期处理库 |
| **RRule** | 2.8.1 | 重复规则处理 |
| **SQLite** | 6.0.1 | 本地数据库存储 |
| **Notifee** | 9.1.8 | 跨平台本地通知 |
| **Lunar-JavaScript** | 1.7.7 | 农历计算与转换 |
| **React Native Calendars** | 1.1313+ | 日历 UI 组件 |
| **Vector Icons** | 10.3.0 | 图标库 |
| **AsyncStorage** | 2.2.0 | 本地数据持久化 |

## 📋 环境要求

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Java**: JDK 17（用于 Android 构建）
- **React Native CLI**: >= 20.0.0
- **Android Studio**: 最新版本（用于 Android 开发）
- **Xcode**: >= 14.0（用于 iOS 开发，仅 macOS）

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd CalendarApp
```

### 2. 安装依赖

```bash
npm install
```

### 3. iOS 配置（仅 macOS）

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

### 4. 启动开发服务器

在一个终端窗口中运行：

```bash
npm start
```

### 5. 运行应用

**Android:**

```bash
# 在新的终端窗口中执行
npm run android
```

**iOS:**

```bash
npm run ios
```

## 📂 项目结构

```
CalendarApp/
├── android/                    # Android 原生代码
├── ios/                        # iOS 原生代码
├── src/
│   ├── components/             # 可复用组件
│   │   ├── Calendar/           # 日历视图组件
│   │   │   ├── MonthView.tsx   # 月视图（支持手势滑动）
│   │   │   ├── WeekView.tsx    # 周视图（时间轴）
│   │   │   └── DayView.tsx     # 日视图（详细时间轴）
│   │   ├── Event/              # 日程相关组件
│   │   │   ├── EventCard.tsx   # 日程卡片
│   │   │   ├── EventForm.tsx   # 日程表单（创建/编辑）
│   │   │   ├── EventDetail.tsx # 日程详情
│   │   │   └── ReminderPicker.tsx # 提醒选择器
│   │   ├── Common/             # 通用 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Header.tsx
│   │   │   └── LunarDatePicker.tsx # 农历日期选择器
│   │   └── Permission/         # 权限处理组件
│   │       └── NotificationPermission.tsx
│   ├── screens/                # 页面组件
│   │   ├── HomeScreen.tsx      # 主页（日历视图）
│   │   ├── EventListScreen.tsx # 日程列表
│   │   └── SettingsScreen.tsx  # 设置页面
│   ├── navigation/             # 导航配置
│   │   └── AppNavigator.tsx    # 底部导航栏
│   ├── store/                  # 状态管理（Zustand）
│   │   ├── eventStore.ts       # 日程状态
│   │   ├── settingsStore.ts    # 设置状态
│   │   └── lunarStore.ts       # 农历缓存状态
│   ├── database/               # 数据库服务
│   │   ├── DatabaseService.ts  # SQLite 数据库管理
│   │   ├── EventDAO.ts         # 日程数据访问
│   │   └── ReminderDAO.ts      # 提醒数据访问
│   ├── services/               # 业务服务
│   │   ├── NotificationService.ts # 通知服务
│   │   ├── ReminderService.ts     # 提醒服务
│   │   └── LunarService.ts        # 农历计算服务
│   ├── types/                  # TypeScript 类型定义
│   │   ├── event.ts            # 日程相关类型
│   │   ├── lunar.ts            # 农历相关类型
│   │   ├── settings.ts         # 设置相关类型
│   │   └── navigation.ts       # 导航类型
│   ├── utils/                  # 工具函数
│   │   ├── dateUtils.ts        # 日期处理工具
│   │   ├── rruleUtils.ts       # 重复规则工具
│   │   └── lazyLoadUtils.ts    # 懒加载工具
│   └── theme/                  # 主题配置
│       ├── colors.ts           # 颜色定义
│       ├── index.ts            # 主题导出
│       └── useAppTheme.ts      # 主题 Hook
├── App.tsx                     # 应用入口
├── package.json
└── tsconfig.json
```

## 🎨 主题系统

项目内置了完整的主题系统，支持浅色/深色/跟随系统三种模式：

```typescript
import { useAppTheme } from './src/theme/useAppTheme';

function MyComponent() {
  const theme = useAppTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello</Text>
    </View>
  );
}
```

主题切换通过设置页面完成，支持实时预览和持久化保存。

## 🌟 核心特性

### RFC 5545 标准支持

本应用完全遵循 RFC 5545 iCalendar 标准：

- ✅ 重复规则（RRULE）完整支持
  - 按频率重复（每天/周/月/年）
  - 按星期重复（如每周一、三、五）
  - 按日期重复（如每月1日和15日）
  - 重复次数控制
  - 重复结束日期
  
- ✅ 全天事件支持
- ✅ 时区处理（统一使用本地时区）
- ✅ 提醒（VALARM）支持

示例 RRULE：
```
FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10
```

### 性能优化

- **懒加载机制**: 视图组件采用三屏懒加载，仅渲染当前、前一个、后一个数据
- **农历缓存**: 农历数据按月缓存，避免重复计算
- **滑动预加载**: 动画执行的同时预加载下一批数据，实现流畅滑动
- **日期单元格优化**: 使用 React.memo 减少不必要的重渲染
- **内存管理**: 自动清理过期缓存，保持内存占用可控

## 📝 可用脚本

```bash
# 启动开发服务器
npm start

# 运行 Android 应用
npm run android

# 运行 iOS 应用
npm run ios

# 代码检查
npm run lint

# 自动修复 lint 问题
npm run lint:fix

# 代码格式化
npm run format

# 运行测试
npm test
```

## 🔧 开发调试

### Android 开发菜单

- Windows/Linux: `Ctrl + M`
- macOS: `Cmd + M`
- 或者摇晃设备

### iOS 开发菜单

- 模拟器: `Cmd + D`
- 或者摇晃设备

### 热重载

- 保存文件后自动刷新（Fast Refresh）
- 手动刷新: 双击 `R` 键（Android）或 `Cmd + R`（iOS）

### 查看日志

```bash
# Android 日志
npx react-native log-android

# iOS 日志
npx react-native log-ios
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm test -- --coverage

# 监听模式
npm test -- --watch
```

## 📦 构建发布

### Android

```bash
cd android
./gradlew assembleRelease
```

生成的 APK 位于: `android/app/build/outputs/apk/release/`

### iOS

1. 在 Xcode 中打开 `ios/CalendarApp.xcworkspace`
2. 选择 `Product` → `Archive`
3. 按照 Xcode 的发布流程操作

## 🐛 常见问题

### 问题 1: Metro 服务器无法启动

```bash
# 清除缓存重启
npm start -- --reset-cache
```

### 问题 2: Android 构建失败

```bash
cd android
.\gradlew clean
.\gradlew --stop
cd ..
npm run android
```

### 问题 3: iOS Pod 安装失败（仅 macOS）

```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install
cd ..
```

### 问题 4: 依赖冲突

```bash
rm -rf node_modules package-lock.json
npm install
```

### 问题 5: Java 版本错误

本项目需要 **Java 17**。如果遇到 Java 版本问题：

```bash
# 检查当前 Java 版本
java -version

# 确保 android/gradle.properties 中配置了正确的 Java 路径
# org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.17.10-hotspot
```

### 问题 6: 通知权限问题

Android 13+ 需要额外的通知权限，应用首次启动时会自动请求。如果拒绝后需要重新开启：

- Android: 设置 → 应用 → CalendarApp → 通知 → 允许
- iOS: 设置 → CalendarApp → 通知 → 允许

### 问题 7: 滑动卡顿或闪烁

如遇到日历视图滑动不流畅，可尝试：
1. 清除应用缓存（设置 → 数据管理 → 清除缓存）
2. 关闭农历显示（设置 → 农历与节日 → 关闭农历显示）
3. 重启应用

## 📖 相关文档

### 快速开始
- [快速启动指南](./快速启动指南.md) - 详细的开发环境配置指南

### 技术实施文档
- [第1-2周](../技术实施文档-第1-2周.md) - 项目初始化与日历视图
- [第3周](../技术实施文档-第3周.md) - 日程管理核心功能
- [第4周](../技术实施文档-第4周.md) - 提醒功能实现
- [第5周](../技术实施文档-第5周.md) - 设置界面与应用配置
- [第6周-农历功能](../技术实施文档-第6周-农历功能.md) - 农历显示与农历日程
- [第6周-性能优化](../技术实施文档-第6周-性能优化.md) - 视图滑动与数据加载优化

### 开发文档
- [日历应用开发计划](../日历应用开发计划.md) - 完整的项目开发计划
- [日视图堆叠算法](../日视图堆叠计算算法.md) - 日视图事件堆叠计算详解

### Debug 文档
- [日历滑动问题](../document/debug/calendar-swipe-bugs.md) - 滑动闪烁问题解决方案
- [提醒通知问题](../document/debug/reminder-notification-bugs.md) - 提醒通知调试记录

### 开发细节
- [日视图渲染详解](../document/development-details/day-render-details.md)
- [日视图事件堆叠](../document/development-details/day-view-event-stacking.md)
- [周视图渲染](../document/development-details/week-view-rendering.md)
- [主题系统实现](../document/development-details/theme-system-implementation.md)

## 🗓️ 开发进度

| 阶段 | 状态 | 完成时间 | 描述 |
|------|------|----------|------|
| **第 1-2 周** | ✅ 完成 | 2026-01-15 | 项目初始化、环境搭建、导航系统、日历视图实现 |
| **第 3 周** | ✅ 完成 | 2026-01-16 | 日程管理核心功能（CRUD、重复规则） |
| **第 4 周** | ✅ 完成 | 2026-01-17 | 提醒功能实现（本地通知、权限处理） |
| **第 5 周** | ✅ 完成 | 2026-01-19 | 设置界面与应用配置（主题、通知、周起始日） |
| **第 6 周** | ✅ 完成 | 2026-01-22 | 农历功能、性能优化（懒加载、缓存） |
| **第 7 周** | 🚧 进行中 | - | **测试与打包阶段** |
| **第 8 周** | ⏳ 待开始 | - | 最终优化与发布准备 |

### 当前阶段：测试与打包

第7周主要任务：
- 功能测试（日程管理、提醒、农历功能）
- 性能测试（滑动流畅度、内存占用）
- 兼容性测试（不同 Android 版本、不同屏幕尺寸）
- Bug 修复
- 打包测试（Debug APK、Release APK）
- 准备应用商店资源（图标、截图、描述）

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 编写所有代码
- 遵循 ESLint 和 Prettier 配置
- 提交前运行 `npm run lint:fix` 和 `npm run format`
- 为新功能添加测试用例

## 📄 许可证

MIT License

Copyright (c) 2026 CalendarApp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🙏 致谢

感谢以下开源项目和资源：

- [React Native](https://reactnative.dev/) - 跨平台移动应用框架
- [React Navigation](https://reactnavigation.org/) - 导航解决方案
- [Zustand](https://github.com/pmndrs/zustand) - 简单的状态管理
- [Day.js](https://day.js.org/) - 轻量级日期处理库
- [RRule](https://github.com/jakubroztocil/rrule) - 重复规则处理
- [Notifee](https://notifee.app/) - React Native 本地通知
- [Lunar-JavaScript](https://github.com/6tail/lunar-javascript) - 农历计算库
- [React Native Calendars](https://github.com/wix/react-native-calendars) - 日历 UI 组件
- [React Native SQLite Storage](https://github.com/andpor/react-native-sqlite-storage) - SQLite 数据库

## 📮 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](../../issues)
- 发送邮件
- 参与讨论

## 🔗 相关链接

- [RFC 5545 标准](https://datatracker.ietf.org/doc/html/rfc5545)
- [React Native 文档](https://reactnative.dev/docs/getting-started)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Notifee 文档](https://notifee.app/react-native/docs/overview)
- [Lunar-JavaScript 文档](https://6tail.cn/calendar/api.html)

---

**项目版本**: v1.0.0  
**最后更新**: 2026-01-22  
**开发状态**: 🚧 测试与打包阶段  
**完成度**: 85%

<div align="center">
  Made with ❤️ using React Native
</div>
