<div align="center">
  <img src="images/logo.png" alt="iScrcpy Logo" width="120" height="120">

  # iScrcpy

  **Android screen mirroring tool powered by scrcpy**

  [![Windows](https://img.shields.io/badge/Windows-0078D4?style=flat-square&logo=windows&logoColor=white)](#)
  [![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple)](#)
  [![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)](#)
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](#)
  [![Version](https://img.shields.io/badge/Version-1.0.7-blue?style=flat-square)](#)

  [English](README.md) | [简体中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md) | [Français](README_FR.md) | [Türkçe](README_TR.md)
</div>

---

![iScrcpy Interface](images/iScrcpy.png)

## Features

- **Multi-language Support**: 7 languages (Chinese, English, Japanese, Korean, Spanish, French, Turkish)
- **Device Management**: Scan and connect USB/WiFi devices with real-time monitoring
- **Display Settings**: Customize resolution, bitrate, frame rate, window options, recording time limit
- **Window Options**: Borderless mode, disable screensaver, always on top, fullscreen
- **Recording**: Auto record, time limit, custom save path
- **Camera Mirroring**: Mirror device camera instead of screen
- **Encoding Settings**: Configure video/audio codecs and bitrate mode
- **Server Configuration**: Manage scrcpy server paths and ADB settings
- **Windows Native**: Custom window with minimize/maximize/close buttons
- **Dark Theme**: Modern dark UI inspired by shadcn/ui

## Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool
- **Electron 28** - Desktop runtime
- **TypeScript** - Type safety
- **i18next** - Internationalization
- **Zustand** - State management
- **Electron Builder** - Installer generation

## Supported Languages

iScrcpy is available in 7 languages:

| Language | Code | Native Name |
|----------|------|-------------|
| English | `en-US` | English |
| 简体中文 | `zh-CN` | 简体中文 |
| 日本語 | `ja-JP` | 日本語 |
| 한국어 | `ko-KR` | 한국어 |
| Español | `es-ES` | Español |
| Français | `fr-FR` | Français |
| Türkçe | `tr-TR` | Türkçe |

Language can be switched from the language selector in the title bar (next to minimize button).

## Documentation

Comprehensive user guides are available in 7 languages:

| Language | Document |
|----------|----------|
| English | [documents/en-US.md](documents/en-US.md) |
| 简体中文 | [documents/zh-CN.md](documents/zh-CN.md) |
| 日本語 | [documents/ja-JP.md](documents/ja-JP.md) |
| 한국어 | [documents/ko-KR.md](documents/ko-KR.md) |
| Español | [documents/es-ES.md](documents/es-ES.md) |
| Français | [documents/fr-FR.md](documents/fr-FR.md) |
| Türkçe | [documents/tr-TR.md](documents/tr-TR.md) |

### Quick Links (English)

- [Getting Started](documents/en-US.md#quick-start)
- [Connecting Devices](documents/en-US.md#connecting-devices)
- [Display Settings](documents/en-US.md#display-settings)
- [Recording Guide](documents/en-US.md#recording)
- [Camera Mirroring](documents/en-US.md#camera-mirroring)
- [FAQ](documents/en-US.md#faq)

## Project Structure

```text
iScrcpy/
├── app/                    # scrcpy binaries and dependencies
│   ├── win/                # Windows binaries
│   │   ├── scrcpy.exe      # scrcpy executable
│   │   ├── scrcpy-server   # scrcpy server jar
│   │   ├── adb.exe         # ADB executable
│   │   ├── SDL2.dll        # SDL2 library
│   │   └── *.dll           # Required DLLs (avcodec, avformat, etc.)
│   ├── mac/                # macOS binaries
│   │   ├── scrcpy
│   │   ├── scrcpy-server
│   │   ├── adb
│   │   └── scrcpy.1        # Man page
│   └── linux/              # Linux binaries
│       ├── scrcpy
│       ├── scrcpy-server
│       ├── adb
│       └── scrcpy.1        # Man page
├── electron/               # Electron main process
│   ├── main.ts             # Main process with IPC handlers
│   ├── main.cjs            # Compiled main process
│   ├── preload.ts          # Preload script for IPC bridge
│   ├── preload.cjs         # Compiled preload script
│   ├── logger.ts           # Logging utility
│   └── resources/          # Build resources
├── src/                    # React application
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Root component
│   ├── i18n/               # Internationalization
│   │   ├── index.ts        # i18n configuration
│   │   └── locales/        # Translation files
│   │       ├── zh-CN.json
│   │       ├── en-US.json
│   │       ├── ja-JP.json
│   │       ├── ko-KR.json
│   │       ├── es-ES.json
│   │       ├── fr-FR.json
│   │       └── tr-TR.json
│   ├── components/         # Reusable components
│   │   ├── TitleBar.tsx    # Title bar with language selector
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── DeviceCard.tsx  # Device card component
│   │   ├── FileManager.tsx # File management dialog
│   │   ├── CloseConfirmDialog.tsx  # Close confirmation
│   │   ├── UpdateDialog.tsx        # Update notification
│   │   └── ui/             # shadcn/ui style components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       └── sonner.tsx
│   ├── pages/              # Page components
│   │   ├── DevicePage.tsx  # Device management page
│   │   ├── DisplayPage.tsx # Display settings page
│   │   ├── EncodingPage.tsx    # Encoding settings page
│   │   ├── ServerPage.tsx      # Server configuration page
│   │   ├── LogsPage.tsx        # Application logs page
│   │   └── AboutPage.tsx       # About page
│   ├── store/              # State management (Zustand)
│   │   └── deviceStore.ts  # Device state store
│   ├── lib/                # Utility libraries
│   │   └── utils.ts        # Utility functions
│   ├── styles/             # CSS styles
│   │   └── index.css       # Global styles
│   ├── utils/              # Utilities
│   │   └── electron.ts     # Electron API bridge
│   ├── types/              # TypeScript type definitions
│   │   └── electron.d.ts   # Electron type declarations
│   ├── assets/             # Static assets
│   │   └── icon.png        # Application icon
│   └── vite-env.d.ts       # Vite type declarations
├── documents/              # User documentation (7 languages)
│   ├── en-US.md            # English user guide
│   ├── zh-CN.md            # Chinese user guide
│   ├── ja-JP.md            # Japanese user guide
│   ├── ko-KR.md            # Korean user guide
│   ├── es-ES.md            # Spanish user guide
│   ├── fr-FR.md            # French user guide
│   └── tr-TR.md            # Turkish user guide
├── images/                 # Screenshots and assets
│   └── iScrcpy.png         # Main interface screenshot
├── logs/                   # Application logs
├── index.html              # HTML entry
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── electron.vite.config.ts # Electron Vite configuration
├── tsconfig.json           # TypeScript configuration
└── forge.config.cjs        # Electron Forge configuration
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development

```bash
npm run dev
```

### 3. Test Mode (Mock Devices)

```bash
TEST=1 npm run dev
```

### 4. Build for Production

```bash
npm run build
```

This will create an `.exe` installer in the `dist-win/` folder.

## scrcpy Options

| Option                      | Description                        |
|-----------------------------|------------------------------------|
| `--max-size=<n>`            | Max video size                     |
| `--video-bit-rate=<n>`      | Video bitrate in Mbps              |
| `--max-fps=<n>`             | Maximum frame rate                 |
| `--video-codec=<c>`         | Video codec (h264, h265, av1)      |
| `--audio-codec=<c>`         | Audio codec (opus, aac)            |
| `--video-encoder=<name>`    | Specific video encoder name        |
| `--always-on-top`           | Keep window on top                 |
| `--fullscreen` / `-f`       | Start in fullscreen                |
| `--stay-awake`              | Keep screen on                     |
| `--window-borderless`       | Borderless window mode             |
| `--disable-screensaver`     | Disable screensaver                |
| `--record=<file>`           | Record screen to file              |
| `--time-limit=<s>`          | Recording time limit in seconds    |
| `--tunnel-forward`          | Use forward tunnel mode            |
| `--no-cleanup`              | Don't cleanup server on exit       |

## Development

### Adding New Languages

1. Create a new translation file in `src/i18n/locales/` (e.g., `de-DE.json`)
2. Copy the structure from an existing language file
3. Translate all text strings
4. Register the language in `src/i18n/index.ts`:

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

### Using Translations in Components

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Ways to Contribute

- Report bugs or suggest features via GitHub Issues
- Add new translations for additional languages
- Improve documentation
- Submit code improvements

## Acknowledgments

- [scrcpy](https://github.com/Genymobile/scrcpy) - The amazing Android screen mirroring tool
- [shadcn/ui](https://ui.shadcn.com/) - UI components inspiration
- All contributors and translators

## License

Apache License 2.0

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
