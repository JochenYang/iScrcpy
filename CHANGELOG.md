# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
