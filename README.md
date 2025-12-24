# iScrcpy

[English](README.md) | [简体中文](README_CN.md)

Android screen mirroring tool powered by scrcpy. A modern Electron desktop application built with React + Vite.

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
iscrcpy/
├── app/                    # scrcpy binaries and dependencies
│   ├── scrcpy.exe
│   ├── scrcpy-server
│   ├── adb.exe
│   └── *.dll
├── electron/               # Electron main process
│   ├── main.ts            # Main process with IPC handlers
│   ├── preload.ts         # Preload script for IPC bridge
│   └── logger.ts          # Logging utility
├── src/                    # React application
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Root component
│   ├── i18n/              # Internationalization
│   │   ├── index.ts       # i18n configuration
│   │   └── locales/       # Translation files
│   │       ├── zh-CN.json
│   │       ├── en-US.json
│   │       ├── ja-JP.json
│   │       ├── ko-KR.json
│   │       ├── es-ES.json
│   │       ├── fr-FR.json
│   │       └── tr-TR.json
│   ├── components/        # Reusable components
│   │   ├── TitleBar.tsx   # Title bar with language selector
│   │   ├── Sidebar.tsx
│   │   └── DeviceCard.tsx
│   ├── pages/             # Page components
│   │   ├── DevicePage.tsx
│   │   ├── DisplayPage.tsx
│   │   ├── EncodingPage.tsx
│   │   ├── ServerPage.tsx
│   │   └── AboutPage.tsx
│   ├── store/             # State management
│   │   └── deviceStore.ts
│   ├── styles/            # CSS styles
│   │   └── index.css
│   ├── utils/             # Utilities
│   │   └── electron.ts    # Electron API bridge
│   └── vite-env.d.ts      # TypeScript declarations
├── documents/              # User documentation (7 languages)
│   ├── en-US.md           # English user guide
│   ├── zh-CN.md           # Chinese user guide
│   ├── ja-JP.md           # Japanese user guide
│   ├── ko-KR.md           # Korean user guide
│   ├── es-ES.md           # Spanish user guide
│   ├── fr-FR.md           # French user guide
│   └── tr-TR.md           # Turkish user guide
├── README_CN.md           # Chinese version of README
├── images/                 # Screenshots and assets
│   └── iScrcpy.png        # Main interface screenshot
├── logs/                   # Application logs
├── index.html              # HTML entry
├── vite.config.ts          # Vite configuration
├── electron.vite.config.ts # Electron Vite configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript configuration
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
