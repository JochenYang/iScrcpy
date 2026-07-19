/**
 * Per-device session overrides for scrcpy restarts.
 * Pure state helpers — no Electron I/O — so unit tests can drive the real merge path.
 *
 * forceRecord:
 *   true  → session recording on (card start-recording)
 *   false → session recording off (card stop-recording); suppresses display.record auto-record
 *   undefined (key absent) → use display.record only
 *
 * enableAudio / forceCamera: last session choice wins across audio/camera restarts
 * until cleared (disconnect / natural process exit / explicit clear).
 *
 * CRITICAL ORDER (restartScrcpySession):
 * 1. beginIntentionalRestart — merge patch + mark preserve BEFORE killing process
 * 2. stopTrackedProcess (detach exit handlers; map.delete before terminate)
 * 3. spawn new process
 * 4. endIntentionalRestart — allow future natural exits to clear session again
 *
 * Process exit must call onProcessExitMaybeClearSession (not bare clearSessionOverrides)
 * so intentional restart kills do not wipe forceRecord mid-toggle.
 */

export interface DeviceSessionOverrides {
  forceRecord?: boolean;
  enableAudio?: boolean;
  forceCamera?: boolean;
}

export type SessionOverridePatch = {
  forceRecord?: boolean;
  enableAudio?: boolean;
  forceCamera?: boolean;
};

/** Merge patch into store; returns full overrides for this device after merge. */
export function applySessionOverrides(
  store: Map<string, DeviceSessionOverrides>,
  deviceId: string,
  patch: SessionOverridePatch
): DeviceSessionOverrides {
  const prev = store.get(deviceId) ?? {};
  const next: DeviceSessionOverrides = { ...prev };

  if (Object.prototype.hasOwnProperty.call(patch, "forceRecord")) {
    next.forceRecord = patch.forceRecord;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "enableAudio")) {
    next.enableAudio = patch.enableAudio;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "forceCamera")) {
    next.forceCamera = patch.forceCamera;
  }

  store.set(deviceId, next);
  return { ...next };
}

/**
 * Resolve overrides for a restart: apply optional patch, then return merged state.
 * Call with empty patch to read without changing (still ensures entry exists if previously set).
 */
export function resolveSessionOverridesForRestart(
  store: Map<string, DeviceSessionOverrides>,
  deviceId: string,
  patch: SessionOverridePatch = {}
): DeviceSessionOverrides {
  const hasPatch =
    Object.prototype.hasOwnProperty.call(patch, "forceRecord") ||
    Object.prototype.hasOwnProperty.call(patch, "enableAudio") ||
    Object.prototype.hasOwnProperty.call(patch, "forceCamera");

  if (hasPatch) {
    return applySessionOverrides(store, deviceId, patch);
  }
  return { ...(store.get(deviceId) ?? {}) };
}

export function clearSessionOverrides(
  store: Map<string, DeviceSessionOverrides>,
  deviceId: string
): void {
  store.delete(deviceId);
}

/**
 * Start an intentional restart: mark preserve, then merge patch.
 * MUST run before killing the old scrcpy process.
 */
export function beginIntentionalRestart(
  preserveSet: Set<string>,
  store: Map<string, DeviceSessionOverrides>,
  deviceId: string,
  patch: SessionOverridePatch = {}
): DeviceSessionOverrides {
  preserveSet.add(deviceId);
  return resolveSessionOverridesForRestart(store, deviceId, patch);
}

/** After new process is registered, allow natural exits to clear session again. */
export function endIntentionalRestart(
  preserveSet: Set<string>,
  deviceId: string
): void {
  preserveSet.delete(deviceId);
}

/**
 * Clear session on process exit only when this is NOT an intentional restart kill.
 * Returns true if session was cleared.
 */
export function onProcessExitMaybeClearSession(
  preserveSet: Set<string>,
  store: Map<string, DeviceSessionOverrides>,
  deviceId: string
): boolean {
  if (preserveSet.has(deviceId)) {
    return false;
  }
  clearSessionOverrides(store, deviceId);
  return true;
}

/**
 * Build the forceRecord value to pass to buildScrcpyArgs from session + display.record.
 * - session forceRecord true/false → that value
 * - session unset → undefined (display.record wins inside buildScrcpyArgs)
 */
export function forceRecordForArgs(
  session: DeviceSessionOverrides
): boolean | undefined {
  if (session.forceRecord === true) return true;
  if (session.forceRecord === false) return false;
  return undefined;
}
