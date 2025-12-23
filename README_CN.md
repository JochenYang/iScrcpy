# iScrcpy

基于 scrcpy 的 Android 设备投屏工具。使用 React + Vite 构建的现代化 Electron 桌面应用程序。

![iScrcpy 界面](images/iScrcpy.png)

## 功能特性

- **多语言支持**：支持 7 种语言（中文、英语、日语、韩语、西班牙语、法语、土耳其语）
- **设备管理**：扫描并连接 USB/WiFi 设备，支持实时监测
- **投屏设置**：自定义分辨率、码率、帧率、窗口选项、录制时间限制
- **窗口选项**：无边框模式、禁止屏幕保护、窗口置顶、全屏
- **录制功能**：自动录制、时间限制、自定义保存路径
- **相机镜像**：镜像设备相机画面而非屏幕
- **编码设置**：配置视频/音频编码器和比特率模式
- **服务器配置**：管理 scrcpy 服务器路径和 ADB 设置
- **Windows 原生**：自定义窗口，支持最小化/最大化/关闭按钮
- **暗色主题**：受 shadcn/ui 启发的现代化暗色 UI

## 技术栈

- **React 18** - UI 框架
- **Vite 5** - 构建工具
- **Electron 28** - 桌面运行时
- **TypeScript** - 类型安全
- **i18next** - 国际化
- **Zustand** - 状态管理
- **Electron Builder** - 安装包生成

## 支持的语言

iScrcpy 支持 7 种语言：

| 语言 | 代码 | 原生名称 |
|------|------|----------|
| 英语 | `en-US` | English |
| 简体中文 | `zh-CN` | 简体中文 |
| 日语 | `ja-JP` | 日本語 |
| 韩语 | `ko-KR` | 한국어 |
| 西班牙语 | `es-ES` | Español |
| 法语 | `fr-FR` | Français |
| 土耳其语 | `tr-TR` | Türkçe |

语言可通过标题栏（最小化按钮旁边）的语言选择器切换。

## 文档

提供多语言详细用户指南：

| 语言 | 文档 |
|------|------|
| 英语 | [documents/en-US.md](documents/en-US.md) |
| 简体中文 | [documents/zh-CN.md](documents/zh-CN.md) |

### 快速链接

- [快速开始](documents/zh-CN.md#快速开始)
- [连接设备](documents/zh-CN.md#连接设备)
- [投屏设置](documents/zh-CN.md#投屏设置)
- [录制功能](documents/zh-CN.md#录制功能)
- [相机镜像](documents/zh-CN.md#相机镜像)
- [常见问题](documents/zh-CN.md#常见问题)

## 项目结构

```text
iscrcpy/
├── app/                    # scrcpy 二进制文件和依赖
│   ├── scrcpy.exe
│   ├── scrcpy-server
│   ├── adb.exe
│   └── *.dll
├── electron/               # Electron 主进程
│   ├── main.ts            # 主进程 IPC 处理器
│   ├── preload.ts         # IPC 桥接预加载脚本
│   └── logger.ts          # 日志工具
├── src/                    # React 应用
│   ├── main.tsx           # 入口文件
│   ├── App.tsx            # 根组件
│   ├── i18n/              # 国际化
│   │   ├── index.ts       # i18n 配置
│   │   └── locales/       # 翻译文件
│   │       ├── zh-CN.json
│   │       ├── en-US.json
│   │       ├── ja-JP.json
│   │       ├── ko-KR.json
│   │       ├── es-ES.json
│   │       ├── fr-FR.json
│   │       └── tr-TR.json
│   ├── components/        # 可复用组件
│   │   ├── TitleBar.tsx   # 标题栏（带语言选择器）
│   │   ├── Sidebar.tsx
│   │   └── DeviceCard.tsx
│   ├── pages/             # 页面组件
│   │   ├── DevicePage.tsx
│   │   ├── DisplayPage.tsx
│   │   ├── EncodingPage.tsx
│   │   ├── ServerPage.tsx
│   │   └── AboutPage.tsx
│   ├── store/             # 状态管理
│   │   └── deviceStore.ts
│   ├── styles/            # CSS 样式
│   │   └── index.css
│   ├── utils/             # 工具函数
│   │   └── electron.ts    # Electron API 桥接
│   └── vite-env.d.ts      # TypeScript 声明
├── documents/              # 用户文档
│   ├── en-US.md           # 英文用户指南
│   └── zh-CN.md           # 中文用户指南
├── images/                 # 截图资源
│   └── iScrcpy.png        # 主界面截图
├── logs/                   # 应用日志
├── index.html              # HTML 入口
├── vite.config.ts          # Vite 配置
├── electron.vite.config.ts # Electron Vite 配置
├── package.json            # 依赖配置
└── tsconfig.json           # TypeScript 配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 运行开发版本

```bash
npm run dev
```

### 3. 测试模式（模拟设备）

```bash
TEST=1 npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

这将在 `dist-win/` 文件夹中创建 `.exe` 安装程序。

## scrcpy 选项

| 选项 | 描述 |
|------|------|
| `--max-size=<n>` | 最大视频尺寸 |
| `--video-bit-rate=<n>` | 视频比特率 (Mbps) |
| `--max-fps=<n>` | 最大帧率 |
| `--video-codec=<c>` | 视频编码器 (h264, h265, av1) |
| `--audio-codec=<c>` | 音频编码器 (opus, aac) |
| `--video-encoder=<name>` | 指定视频编码器名称 |
| `--always-on-top` | 窗口置顶 |
| `--fullscreen` / `-f` | 全屏启动 |
| `--stay-awake` | 保持屏幕常亮 |
| `--window-borderless` | 无边框窗口模式 |
| `--disable-screensaver` | 禁止屏幕保护 |
| `--record=<file>` | 录制屏幕到文件 |
| `--time-limit=<s>` | 录制时间限制（秒） |
| `--tunnel-forward` | 使用正向隧道模式 |
| `--no-cleanup` | 退出时不清理服务器 |

## 开发

### 添加新语言

1. 在 `src/i18n/locales/` 创建新的翻译文件（如 `de-DE.json`）
2. 从现有语言文件复制结构
3. 翻译所有文本字符串
4. 在 `src/i18n/index.ts` 注册语言：

```typescript
import deDE from './locales/de-DE.json';

const resources = {
  ...
  'de-DE': { translation: deDE },
};

export const languages = [
  ...
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
];
```

### 在组件中使用翻译

```typescript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('devices.title')}</h1>
      <button>{t('devices.refresh')}</button>
    </div>
  );
}
```

## 贡献

欢迎贡献！请随时提交 Pull Request。

### 贡献方式

- 通过 GitHub Issues 报告错误或提出功能建议
- 添加新语言翻译
- 改进文档
- 提交代码改进

## 致谢

- [scrcpy](https://github.com/Genymobile/scrcpy) - 优秀的 Android 投屏工具
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件灵感来源
- 所有贡献者和翻译者

## 许可证

Apache License 2.0

根据 Apache 许可证 2.0 版（"许可证"）授权；
除非遵守许可证，否则您不得使用此文件。
您可以在以下地址获取许可证副本：

    http://www.apache.org/licenses/LICENSE-2.0

除非适用法律要求或书面同意，否则根据许可证分发的软件
按"原样"分发，不提供任何明示或暗示的保证或条件。
有关管理权限和限制的具体语言，请参阅许可证。
