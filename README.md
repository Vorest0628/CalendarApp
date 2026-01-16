# 📅 CalendarApp
前言：本项目为腾讯营地大前端项目大作业

一款基于 React Native 开发的跨平台日历应用，支持 Android、iOS 和鸿蒙平台。完全遵循 [RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545) iCalendar 标准，提供日程管理、提醒通知、数据导入导出等核心功能。

## ✨ 功能特性

### 核心功能

- **📅 多视图展示**
  - 月视图 - 完整月份日历网格展示
  - 周视图 - 按周展示时间轴
  - 日视图 - 单日详细日程列表
  - 流畅的视图切换动画

- **📝 日程管理**
  - 创建、编辑、删除日程
  - 支持全天事件和时间段事件
  - 颜色标签分类
  - 地点和描述信息
  - 重复日程设置（基于 RRULE 标准）

- **🔔 智能提醒**
  - 多种提醒时间选项（事件时/提前 5-60 分钟/提前数小时）
  - 本地推送通知
  - 提醒管理（延后、标记完成）

### 扩展功能

- **📤 导入/导出**
  - 导出为标准 .ics 文件（RFC 5545）
  - 从其他日历应用导入
  - 批量导入导出
  - 文件分享功能

- **🌐 网络订阅**
  - 订阅公共日历（节假日、体育赛事等）
  - HTTP/HTTPS URL 订阅支持
  - 自动同步更新
  - 多日历管理

- **🏮 农历支持**
  - 显示农历日期
  - 节气标注
  - 传统节日提醒
  - 农历日程创建

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React Native** | 0.83.1 | 跨平台移动应用框架 |
| **TypeScript** | 5.8.3 | 类型安全的 JavaScript 超集 |
| **React Navigation** | 7.0+ | 路由和导航管理 |
| **Zustand** | 5.0.9 | 轻量级状态管理 |
| **Day.js** | 1.11.19 | 日期处理库 |
| **ical.js** | 2.2.1 | RFC 5545 iCalendar 解析 |
| **SQLite** | 6.0.1 | 本地数据库存储 |
| **React Native Calendars** | 1.1313+ | 日历 UI 组件 |
| **Vector Icons** | 10.3.0 | 图标库 |

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
├── android/              # Android 原生代码
├── ios/                  # iOS 原生代码
├── src/
│   ├── components/       # 可复用组件
│   │   ├── Calendar/     # 日历视图组件
│   │   │   ├── MonthView.tsx
│   │   │   ├── WeekView.tsx
│   │   │   └── DayView.tsx
│   │   ├── Event/        # 日程相关组件
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   └── EventDetail.tsx
│   │   └── Common/       # 通用 UI 组件
│   │       ├── Button.tsx
│   │       └── Header.tsx
│   ├── screens/          # 页面组件
│   │   ├── HomeScreen.tsx
│   │   ├── EventListScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/       # 导航配置
│   │   └── AppNavigator.tsx
│   ├── store/            # 状态管理（Zustand）
│   │   └── eventStore.ts
│   ├── database/         # 数据库服务
│   │   ├── DatabaseService.ts
│   │   └── EventDAO.ts
│   ├── types/            # TypeScript 类型定义
│   │   ├── event.ts
│   │   └── navigation.ts
│   ├── utils/            # 工具函数
│   │   ├── dateUtils.ts
│   │   └── rruleUtils.ts
│   └── theme/            # 主题配置
│       ├── colors.ts
│       └── index.ts
├── App.tsx               # 应用入口
├── package.json
└── tsconfig.json
```

## 🎨 主题系统

项目内置了完整的主题系统，支持统一的颜色管理和样式配置：

```typescript
import { theme } from './src/theme';

// 使用主题颜色
backgroundColor: theme.colors.primary
padding: theme.spacing.md
borderRadius: theme.borderRadius.md
```

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
./gradlew clean
./gradlew --stop
cd ..
npm run android
```

### 问题 3: iOS Pod 安装失败

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

## 📖 相关文档

- [快速启动指南](./快速启动指南.md) - 详细的开发环境配置
- [第一周完成总结](./第一周完成总结.md) - 项目初始化记录
- [技术实施文档](../技术实施文档-第1-2周.md) - 详细的技术实现文档
- [日历应用开发计划](../日历应用开发计划.md) - 完整的项目开发计划

## 🌟 RFC 5545 标准支持

本应用完全遵循 RFC 5545 iCalendar 标准，支持：

- ✅ VEVENT（事件）
- ✅ RRULE（重复规则）
- ✅ VALARM（提醒）
- ✅ .ics 文件导入/导出
- ✅ 时区处理
- ✅ 全天事件

示例 RRULE：

```
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10
```

## 🗓️ 开发进度

| 阶段 | 状态 | 描述 |
|------|------|------|
| 第 1 周 | ✅ 完成 | 项目初始化、环境搭建、导航系统 |
| 第 2 周 | 🚧 进行中 | 日历视图、UI 组件 |
| 第 3 周 | ⏳ 待开始 | 日程管理核心功能 |
| 第 4 周 | ⏳ 待开始 | 提醒功能实现 |
| 第 5 周 | ⏳ 待开始 | 导入导出功能 |
| 第 6 周 | ⏳ 待开始 | 网络订阅功能 |
| 第 7 周 | ⏳ 待开始 | 农历功能与优化 |
| 第 8 周 | ⏳ 待开始 | 测试、打包与发布 |

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
- [ical.js](https://github.com/kewisch/ical.js/) - iCalendar 标准实现
- [React Native Calendars](https://github.com/wix/react-native-calendars) - 日历 UI 组件
- [Day.js](https://day.js.org/) - 轻量级日期处理库
- [Zustand](https://github.com/pmndrs/zustand) - 简单的状态管理
- [React Navigation](https://reactnavigation.org/) - 导航解决方案

## 📮 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](../../issues)
- 发送邮件
- 参与讨论

## 🔗 相关链接

- [RFC 5545 标准](https://datatracker.ietf.org/doc/html/rfc5545)
- [React Native 文档](https://reactnative.dev/docs/getting-started)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [ical.js 文档](https://github.com/kewisch/ical.js/wiki)

---

**项目版本**: v0.0.1  
**最后更新**: 2026-01-16  
**开发状态**: 🚧 开发中

<div align="center">
  Made with ❤️ using React Native
</div>
