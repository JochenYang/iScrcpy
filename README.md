# iScrcpy

Android screen mirroring tool powered by scrcpy. A modern Electron desktop application built with React + Vite.

## Features

- **Multi-language Support**: 7 languages (Chinese, English, Japanese, Korean, Spanish, French, Turkish)
- **Device Management**: Scan and connect USB/WiFi devices
- **Display Settings**: Customize resolution, bitrate, frame rate, window options
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

- 简体中文 (Simplified Chinese)
- English
- 日本語 (Japanese)
- 한국어 (Korean)
- Español (Spanish)
- Français (French)
- Türkçe (Turkish)

Language can be switched from the language selector in the title bar (next to minimize button).

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
├── doc/                    # scrcpy official documentation
├── logs/                   # Application logs
├── index.html              # HTML entry
├── vite.config.ts          # Vite configuration
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

| Option                | Description                    |
|-----------------------|--------------------------------|
| `--max-size=<n>`      | Max video size (default: 1920) |
| `--video-bitrate=<n>` | Video bitrate in Mbps          |
| `--frame-rate=<n>`    | Frame rate                     |
| `--video-codec=<c>`   | Video codec (h264, h265, av1)  |
| `--audio-codec=<c>`   | Audio codec (opus, aac)        |
| `--always-on-top`     | Keep window on top             |
| `--fullscreen`        | Start in fullscreen            |
| `--stay-awake`        | Keep screen on                 |
| `--tunnel-forward`    | Use forward tunnel mode        |
| `--no-cleanup`        | Don't cleanup server on exit   |

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

## License

MIT License
