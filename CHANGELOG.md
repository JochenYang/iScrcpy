# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/JochenYang/iScrcpy/compare/v1.0.0...v1.1.0) (2025-12-28)


### Features

* add close confirmation dialog with tray support ([542a519](https://github.com/JochenYang/iScrcpy/commit/542a51989ed016016f63b6d98e470912beac6e8c))
* add custom close confirmation dialog with multi-language support ([3bfa5e1](https://github.com/JochenYang/iScrcpy/commit/3bfa5e19a6383baa6013fb9a6d09447484bc48c7))
* add file manager and APK install feature ([13388e1](https://github.com/JochenYang/iScrcpy/commit/13388e1e435a4a093b90a47a6e785ef6f54efb41))


### Bug Fixes

* add missing close confirmation API in utils/electron.ts ([3c8b2aa](https://github.com/JochenYang/iScrcpy/commit/3c8b2aa308bcaeaacc80ad156146913d4c435321))
* close confirmation dialog improvements ([0670846](https://github.com/JochenYang/iScrcpy/commit/0670846c447c5097202b647ad0a72eab7f4b093d))
* ensure quit action closes the application ([76f4316](https://github.com/JochenYang/iScrcpy/commit/76f43160bb66f08d66debfe982b6b74697521e71))
* resolve ADB path issue in dev mode and improve error messages ([2352eeb](https://github.com/JochenYang/iScrcpy/commit/2352eeb67f061bdd603bee7c197664f5e99bfdee))

## [Unreleased]

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
