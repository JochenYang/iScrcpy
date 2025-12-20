# iScrcpy

Android screen mirroring tool powered by scrcpy. A modern Electron desktop application built with React + Vite.

## Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool
- **Electron 28** - Desktop runtime
- **TypeScript** - Type safety
- **Electron Builder** - Installer generation

## Project Structure

```
iscrcpy/
├── app/                    # scrcpy binaries and dependencies
│   ├── scrcpy.exe
│   ├── scrcpy-server
│   ├── adb.exe
│   └── *.dll
├── electron/               # Electron main process
│   ├── main.ts            # Main process with IPC handlers
│   └── preload.ts         # Preload script for IPC bridge
├── src/                    # React application
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Root component
│   ├── components/        # Reusable components
│   │   ├── TitleBar.tsx
│   │   ├── Sidebar.tsx
│   │   └── DeviceCard.tsx
│   ├── pages/             # Page components
│   │   ├── DevicePage.tsx
│   │   ├── DisplayPage.tsx
│   │   ├── EncodingPage.tsx
│   │   └── ServerPage.tsx
│   ├── styles/            # CSS styles
│   │   └── index.css
│   ├── utils/             # Utilities
│   │   └── electron.ts    # Electron API bridge
│   └── vite-env.d.ts      # TypeScript declarations
├── doc/                    # scrcpy official documentation
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

## Features

- **Device Management**: Scan and connect USB/WIFI devices
- **Display Settings**: Customize resolution, bitrate, frame rate, window options
- **Encoding Settings**: Configure video/audio codecs and bitrate mode
- **Server Configuration**: Manage scrcpy server paths and ADB settings
- **Windows Native**: Custom window with minimize/maximize/close buttons
- **Dark Theme**: Modern dark UI inspired by shadcn/ui

## scrcpy Options

| Option | Description |
|--------|-------------|
| `--max-size=<n>` | Max video size (default: 1920) |
| `--video-bitrate=<n>` | Video bitrate in Mbps |
| `--frame-rate=<n>` | Frame rate |
| `--video-codec=<c>` | Video codec (h264, h265, av1) |
| `--audio-codec=<c>` | Audio codec (opus, aac) |
| `--always-on-top` | Keep window on top |
| `--fullscreen` | Start in fullscreen |
| `--stay-awake` | Keep screen on |
| `--tunnel-forward` | Use forward tunnel mode |
| `--no-cleanup` | Don't cleanup server on exit |

## License

MIT License
