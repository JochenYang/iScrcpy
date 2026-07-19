# AGENTS.md — iScrcpy contributor notes

Rules for humans and AI agents working in this repository. **Project rules override personal global agent configs.**

## What this project is

iScrcpy is an **Electron + React** desktop UI around bundled **scrcpy 4.x** and ADB: device list, screen mirroring, session recording, camera source, file manager, i18n.

| Area | Location |
|------|----------|
| Main process | `electron/main.ts` |
| Scrcpy argv builder (pure, unit-tested) | `electron/scrcpyArgs.ts` |
| Session override merge (pure) | `electron/sessionOverrides.ts` |
| Renderer | `src/` |
| Bundled binaries | `app/win`, `app/mac`, `app/linux` |

## Scrcpy CLI rules (hard)

1. **All launch paths** must use `buildScrcpyArgs()` from `electron/scrcpyArgs.ts`. Do not copy-paste argv construction in individual IPC handlers.
2. **Never** pass obsolete or unknown flags to scrcpy. Especially:
   - **`--record-audio`**: scrcpy 4.x exits with `unknown option`. Whether a recording has audio depends on the **audio stream** (omit `--no-audio`), not this flag.
3. **Camera video** must include `--video-source=camera` (display-settings camera mode, toggle-camera, and independent start-camera). Screen-only mirror paths must **not** force a camera source.
4. **`bitrateMode` (VBR/CBR)**: scrcpy 4.x has **no** simple CLI mapping. `buildScrcpyArgs` must **not** emit cbr/vbr-related flags. The UI control is disabled and labeled unsupported; the field is kept only for settings compatibility.
5. After changing flags, verify at least:
   - Run bundled `scrcpy --help` and confirm the flag exists;
   - For risky flags, run `scrcpy --that-flag` and ensure it is not `unknown option`;
   - Run `npm run test:args` (imports the real `buildScrcpyArgs` / session helpers).

## Settings vs session state

| Concept | Persisted? | Notes |
|---------|------------|--------|
| Auto-record `settings.display.record` | Yes (Display settings save) | Only the Display page “auto-record” toggle; **card session recording must not rewrite this** |
| Session record start/stop | No (in-memory Map) | `deviceSessionOverrides.forceRecord` true/false; merge via `beginIntentionalRestart` **before** kill; process exit must **not** clear the Map during intentional restart (`preserveSessionOnExit`) |
| Session audio / camera overrides | No (same Map) | `onProcessExitMaybeClearSession` clears only when not in an intentional restart |
| Global `enableAudio` preference | Yes | Saved from settings |
| Card audio toggle | Session override | Restarts scrcpy with session `enableAudio`; do not persist solely for card toggles |
| `recordAudio` setting field | May be stored | Compatibility only; **must not** become `--record-audio`. Enabling it should keep the audio stream on |

**Restart order (required):**  
`beginIntentionalRestart` → `stopTrackedProcess({ forRestart: true })` → spawn → `endIntentionalRestart`.  
Do **not** kill then merge.

## Device status rules

1. After a **successful non-empty** ADB list: merge into the store and **end** that load. Do not run a second “confirm empty” poll that bulk-marks everything offline.
2. Bulk-mark known devices offline **only** after retries are exhausted and the attempt still failed or returned empty.
3. If USB is briefly missing from `adb devices`, prefer last known status; device-tracker `remove` is one authority for offline.
4. `mirroringDevices` / `recordingDevices` / `cameraDevices` are renderer session state; process death must update them via IPC (`scrcpy-exit` / `camera-exit`).

## Process lifecycle

1. Stop scrcpy/camera processes **only** through `terminateProcess` / `stopTrackedProcess` in `electron/main.ts`.
2. **Do not** scatter bare `taskkill` / `tasklist` in record / audio / camera handlers (Windows specifics stay inside the shared terminate / `isProcessRunning` helpers).
3. Liveness checks use `isProcessRunning` (cross-platform); do not hard-code `tasklist` on the connect path.
4. Mirror processes: `deviceProcesses`. Independent camera: `cameraProcesses`. Do not mix the maps.

## Change discipline

- Prefer minimal correct diffs; do not opportunistically refactor dual packaging (forge vs electron-builder), wholesale i18n polish, or file-manager security redesigns unless the task asks for it.
- Do not `git commit` or force-push unless the maintainer explicitly requests it.

## i18n

- User-facing strings live under `src/i18n/locales/*.json`.
- New keys must be translated for **all** supported locales (not English-only placeholders outside `en-US`).
- `fallbackLng` is `zh-CN` in app config; still ship proper translations per language file.

## Verification (mirroring / recording / camera changes)

Before handoff:

```text
# 1) No production --record-audio argv
rg "record-audio" electron src --glob "!**/*.md"

# 2) Unit tests (real shipped modules)
npm run test:args

# 3) Bundled scrcpy help has no --record-audio
app/win/scrcpy.exe --help   # or platform equivalent

# 4) Optional static checks
npm run lint   # note pre-existing issues if unrelated
```

For camera work: confirm every camera-intent path includes `video-source=camera`, and screen paths do not force camera.

## Common pitfalls (from past audits)

- Major scrcpy upgrades break old flags → always check the **bundled binary**, not only old CHANGELOG lines.
- Duplicated argv builders → one branch fixed, another still broken → keep a single `buildScrcpyArgs`.
- `loadDevices` success then a second empty poll → UI flash-offline for all devices.
- Session recording writing `settings.display.record = true/false` → corrupts the user’s auto-record preference.
- Killing scrcpy **before** merging session overrides → exit handler clears the Map → next toggle drops session record.

## Tests

- `npm run test:args` runs `electron/scrcpyArgs.test.ts` and `electron/sessionOverrides.test.ts`.
- Tests must **import** the shipped modules; do not reimplement the builder inside the test.
- Without a real device: arg unit tests + CLI help/grep are enough to guard unknown-option regressions; full hardware E2E is not the default gate for this repo.
