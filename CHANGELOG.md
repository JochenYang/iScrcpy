# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.9] - 2026-01-11

### Fixed

- Fixed duplicate toast notifications when stopping mirroring (toast appeared twice in different languages)
- Toast now properly prevents overlapping when triggered rapidly
- Unified toast implementation across DevicePage and DeviceCard components

### Added

- Added shared toast utility with type support (success, error, warning, info)
- Toast styles now support different visual types with proper theme colors

## [1.1.8] - 2026-01-09

### Added

- Added hardware encoder selection support for improved WiFi streaming performance
- Users can now select from available device encoders via dropdown menu
- Recommended hardware encoders (c2.qti.*, OMX.qcom.*) are marked with ★ indicator
- Encoder info display shows current selected encoder name
- Click-to-load approach (encoders load on dropdown click for better UX)
- Added multi-language translations for encoder UI (7 languages)

### Fixed

- Fixed saved encoder value not displaying after page reload
- Fixed encoder parsing issue when loading saved settings
- Removed debug console.log statements from EncodingPage component

### Changed

- Updated videoEncoder description text to guide users to hardware encoder selection
- Improved encoder loading UX with toast notification when encoders are loaded
- Encoder selection now uses "codec & encoder" format internally for better compatibility

## [1.1.7] - 2026-01-08

### Fixed

- Fixed custom resolution/frameRate/bitrate not persisting after restart (state management bug)
- Fixed custom resolution label showing "Max Resolution" instead of "Custom Resolution"
- Fixed installer file deletion failing on Windows due to file locking
- Changed default video buffer to 0 (disabled for real-time mirroring)
- Fixed resolution custom option not showing input box

### Changed

- Removed auto-generation of version.json during release workflow (manual update required)
- Optimized event listener binding in DevicePage (bind once instead of re-binding on state changes)
- Optimized startup process: parallel ADB start and device tracker initialization
- Reduced auto-connect delay from 500ms to 300ms

## [1.1.6] - 2026-01-07

### Fixed

- Fixed scrcpy startup failure due to incorrect buffer parameter (changed from --buffer to --video-buffer)
- Fixed settings saving outputting duplicate log entries (optimized to single file write)

### Added

- Added Video Buffer setting for smoother playback on high-resolution or unstable networks
- Added multi-language support for Video Buffer UI (7 languages)
- Added improved command preview showing all active scrcpy parameters

### Changed

- Changed default Video Buffer to 0 for real-time mirroring (no additional latency)
- Optimized settings save to use batch operation for display and encoding settings
- Improved label and icon spacing in form groups for better visual appearance
- Updated all comments to English for codebase consistency

### Performance

- Added React.memo to DeviceCard component to prevent unnecessary re-renders during polling
- DeviceCard now only re-renders when device props or connection status actually changes

### Fixed

- Fixed app startup failure in production environment
- Fixed ADB daemon not starting properly causing "cannot connect to daemon" error
- Fixed missing IPC handlers (quit-app, onQuitAnimation) causing renderer errors
- Fixed device tracker initialization failing when ADB not ready

### Changed

- Changed ADB server startup to use exec() instead of spawn() with unref() for reliable startup
- Changed startup sequence: show window → start ADB → init tracker → auto-connect
- Simplified ADB server ready logic by removing caching mechanism

### Added

- Added startAdbServer() function that properly waits for ADB to start

## [1.1.4] - 2026-01-07

### Fixed

- Fixed device status flicker on startup (devices now show persisted state immediately)
- Fixed log level not being respected in production environment
- Fixed ADB server ready polling issue (prevented repeated `adb start-server` calls)
- Fixed device tracker initialization timing issue
- Fixed quit animation not displaying when closing app

### Changed

- Optimized startup speed - window now displays immediately while ADB starts in background
- Device tracker now initializes after ADB is ready to prevent connection errors
- Device status merge logic improved - current device status takes priority over historical data
- Persisted storage now only saves device metadata (id, name, type), not status
- Loading indicator now displays immediately on startup
- Auto-reconnect WiFi devices only on manual refresh, not on every startup

### Added

- Added quit termination animation with spinner
- Added multi-language support for termination messages (7 languages)
- Added device detection loading indicator with translations
- Added device removed toast message with translations

### Refactored

- Refactored `ensureAdbServerReady()` to use spawn() and prevent concurrent launches
- Added retry mechanism for device loading with exponential backoff

## [1.1.3] - 2026-01-06

### Fixed

- Fixed device status flicker on startup (devices now show persisted state immediately)
- Fixed log level not being respected in production environment

### Changed

- Device tracker now initializes after window is shown to prevent status flicker
- Log level filtering now properly respects user settings in production mode

## [1.1.2] - 2026-01-06

### Security

- Added command injection protection for file operations (delete, create folder)
- Added path traversal protection for file downloads
- Restricted test mode to non-production environments only
- Added input validation for device IDs and file paths

### Fixed

- Fixed potential command injection vulnerabilities in file manager operations
- Fixed path traversal vulnerability in download functionality
- Fixed resource leak issue with unchecked intervals

### Changed

- Update downloads now save to desktop for easy manual cleanup
- Improved process termination logic with graceful fallback
- All timeout values are now configurable constants

### Refactored

- Unified process termination function to reduce code duplication
- Added interval tracking system to prevent resource leaks
- Added security utility functions (sanitizeDevicePath, validateSavePath, isValidDeviceId)

## [1.1.1] - 2026-01-06

### Fixed

- Fixed tray right-click exit not responding
- Fixed tray icon residue after exit
- Fixed context menu not displaying on second right-click
- Fixed 4 iscrcpy processes remaining after exit
- Optimized exit flow to use app.exit(0) for direct exit

### Changed

- WiFi device connection state is now persisted (maintains connection status after app restart)
- Renamed "build" folder to "icons" for clearer resource organization

### Refactored

- Unified exit flow across all exit scenarios (tray quit, window close, X button)
- Simplified mainWindow.on("closed") handler
- Simplified will-quit handler to prevent duplicate cleanup
- Removed duplicate process cleanup logic

## [1.1.0] - 2026-01-05

### Fixed

- Fixed app not exiting properly after clicking "Install Update" in packaged mode
- Fixed infinite loop when quitting app (will-quit event triggered multiple times)
- Removed 1-hour time limit for installer cleanup (now deletes unconditionally)

### Changed

- Optimized update installation flow: destroy window → delay → exit
- Improved process cleanup to prevent duplicate cleanup calls
- Simplified installer deletion logic for more reliable cleanup

## [1.0.9] - 2026-01-05

### Fixed

- Fixed file download encoding issues on Windows (Chinese system)
- Fixed false offline status when device tracker reports "offline" before ADB confirms
- File download and upload now use spawn instead of exec to avoid shell encoding problems
- Device status is now verified with adb devices before marking as offline

### Added

- Added real-time device tracking using adbkit's trackDevices() for instant status updates
- Device status now updates immediately when devices connect or disconnect
- WiFi devices now show actual device name (e.g., "PJD110") instead of IP address after connection

### Changed

- Device offline detection now requires ADB confirmation to prevent false status updates

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
