# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.9] - 2026-01-04

### Added

- Added real-time device tracking using adbkit's trackDevices() for instant status updates
- Device status now updates immediately when devices connect or disconnect
- WiFi devices now show actual device name (e.g., "PJD110") instead of IP address after connection

### Fixed

- Fixed app not exiting properly in development mode when closing
- Fixed device tracker initialization error in development mode
- Fixed device name not updating after successful WiFi connection

## [1.0.8] - 2026-01-04

### Fixed

- Fixed app not closing during update installation in development mode
- Application now properly quits before installer starts

### Added

- Added automatic cleanup of all subprocesses before update installation (scrcpy, ADB, camera)
- Added automatic deletion of installer files after successful installation
- Installer files are automatically removed on next app launch (after 1 hour)

## [1.0.7] - 2026-01-02

### Fixed

- Fixed WiFi device status not updating after app restart
- WiFi devices now auto-reconnect when app restarts and ADB server resets
- USB devices are now immediately marked as offline when disconnected
- WiFi devices maintain their status when temporarily undetected by ADB

### Changed

- Device status logic: always update from ADB response
- Device list rendering: merge knownDevices with current devices for accurate status
- Tray menu logging now uses debug level to match software log level settings

### Docs

- Redesigned README header with logo and platform badges
- Updated project structure documentation to match actual codebase
- Added interface screenshot above features section

## [1.0.6] - 2026-01-01

### Added

- Added device removal feature - users can now remove devices from the list
- USB devices will automatically reappear when USB is connected after removal
- WiFi devices remain removed until manually reconnected via IP input or "Enable Wifi" button
- Tray menu and tooltip now support multi-language translations (7 languages)
- Development mode logging always shows info level and above

### Fixed

- Fixed display resolution max-size values for scrcpy to use correct dimensions
- Fixed device removal logic to properly handle both USB and WiFi devices
- Fixed tray menu translations not updating in development mode

### Changed

- Development mode: tray translations always log info level and above regardless of user settings

## [1.0.5] - 2025-12-29

### Fixed

- Fixed update dialog crash when displaying multilingual release notes
- Update dialog now properly handles releaseNotes as object with multiple languages
- Added automatic language detection based on user's current locale

## [1.0.4] - 2025-12-29

### Changed

- Switched update checking from GitHub API to GitHub Pages to avoid rate limit errors
- Update check now uses static version.json file for better reliability
- Added automatic version.json deployment to gh-pages during release

### Fixed

- Fixed update check 403 error caused by GitHub API rate limiting

## [1.0.3] - 2025-12-28

### Fixed

- Fixed update download functionality with progress display
- Fixed visit release page to open correct URL
- Added common translations for all languages
- Added GitHub token support for API rate limit
- Improved download progress communication between main and renderer processes

## [1.0.2] - 2025-12-28

### Fixed

- Fixed update download speed issue by using electron-dl library
- Improved GitHub Actions release workflow changelog extraction

## [1.0.1] - 2025-12-28

### Added

- File manager for Android devices (list, download, upload, delete, create folder)
- APK installation support for connected devices
- Auto-update checking from GitHub releases
- Custom update dialog with download and install functionality
- System tray icon with context menu
- Close confirmation dialog with minimize-to-tray option

### Changed

- Rename SettingsPage to LogsPage for accuracy
- Improved file size display in file manager
- Multiple UI improvements and bug fixes

### Fixed

- Various bug fixes and stability improvements

## [1.0.0] - 2025-12-23

### Added

- Initial release
- Multi-language support (7 languages)
- USB and WiFi device connection
- Display settings (resolution, bitrate, frame rate)
- Recording functionality with time limit
- Camera mirroring support
- Window options (borderless, screensaver disable)
- Encoding settings
- Server configuration
- Modern dark theme UI
- Real-time device monitoring
- Custom window controls

### Changed

- Improved device detection
- Optimized recording performance

### Fixed

- Various bug fixes

## Supported Languages

- English (en-US)
- Simplified Chinese (zh-CN)
- Japanese (ja-JP)
- Korean (ko-KR)
- Spanish (es-ES)
- French (fr-FR)
- Turkish (tr-TR)
