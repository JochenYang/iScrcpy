/**
 * Session override + intentional-restart order tests.
 * Drives shipped helpers (beginIntentionalRestart / onProcessExitMaybeClearSession / buildScrcpyArgs).
 * Run: npx tsx electron/sessionOverrides.test.ts
 */
import { buildScrcpyArgs, argvContainsRecordAudio } from "./scrcpyArgs";
import {
  beginIntentionalRestart,
  clearSessionOverrides,
  endIntentionalRestart,
  forceRecordForArgs,
  onProcessExitMaybeClearSession,
  type DeviceSessionOverrides,
  type SessionOverridePatch,
} from "./sessionOverrides";

const baseDisplay = {
  maxSize: 1920,
  videoBitrate: 8,
  frameRate: 60,
  buffer: 0,
  alwaysOnTop: false,
  fullscreen: false,
  stayAwake: false,
  enableVideo: true,
  enableAudio: true,
  record: false,
  recordPath: "",
  recordTimeLimit: 0,
  camera: false,
  cameraId: "",
  cameraSize: "1920x1080",
  cameraFps: 30,
  windowBorderless: false,
  disableScreensaver: false,
  recordAudio: true,
};

const encoding = { videoCodec: "h264", audioCodec: "opus", bitrateMode: "cbr" };
const server = { tunnelMode: "reverse", cleanup: true };

let passed = 0;
let failed = 0;

function assert(cond: boolean, message: string) {
  if (cond) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

/**
 * Shipped restart order from main.restartScrcpySession:
 * beginIntentionalRestart → (simulate kill close) onProcessExitMaybeClearSession → build args → endIntentionalRestart
 */
function simulateRestartScrcpySessionOrder(
  store: Map<string, DeviceSessionOverrides>,
  preserve: Set<string>,
  deviceId: string,
  patch: SessionOverridePatch,
  display = baseDisplay
) {
  // 1. Merge + preserve BEFORE kill (required)
  const session = beginIntentionalRestart(preserve, store, deviceId, patch);
  const forceRecord = forceRecordForArgs(session);

  // 2. Simulate old process close/notifyScrcpyExit during kill
  const clearedDuringKill = onProcessExitMaybeClearSession(
    preserve,
    store,
    deviceId
  );

  // Session must still be intact after simulated exit
  const afterKill = store.get(deviceId);

  const willRecord =
    forceRecord === true || (forceRecord !== false && display.record);
  const args = buildScrcpyArgs({
    deviceId,
    display,
    encoding,
    server,
    resolvedRecordPath: willRecord ? "C:/rec.mp4" : undefined,
    forceRecord,
    enableAudio: session.enableAudio,
    forceCamera: session.forceCamera,
  });

  // 4. New process registered — allow natural clear again
  endIntentionalRestart(preserve, deviceId);

  return { args, session, clearedDuringKill, afterKill };
}

/**
 * Buggy historical order: kill/clear FIRST then merge patch only.
 * Used only to document that without preserve+begin-first, forceRecord is lost.
 */
function simulateBuggyKillThenMerge(
  store: Map<string, DeviceSessionOverrides>,
  preserve: Set<string>,
  deviceId: string,
  patch: SessionOverridePatch
) {
  // kill clears session (no preserve)
  onProcessExitMaybeClearSession(preserve, store, deviceId);
  // then only current patch remains
  return beginIntentionalRestart(preserve, store, deviceId, patch);
}

console.log("sessionOverrides restart order (shipped path)\n");

// --- Matrix with correct order: start-record → audio → camera ---
{
  const store = new Map<string, DeviceSessionOverrides>();
  const preserve = new Set<string>();
  const id = "dev-session";

  let r = simulateRestartScrcpySessionOrder(store, preserve, id, {
    forceRecord: true,
  });
  assert(r.args.includes("--record"), "start-recording adds --record");
  assert(!argvContainsRecordAudio(r.args), "no --record-audio");
  assert(r.clearedDuringKill === false, "kill exit does not clear during restart");
  assert(r.afterKill?.forceRecord === true, "forceRecord survives kill notify");
  assert(store.get(id)?.forceRecord === true, "store still has forceRecord after restart");

  r = simulateRestartScrcpySessionOrder(store, preserve, id, {
    enableAudio: false,
  });
  assert(r.args.includes("--record"), "toggle-audio keeps --record after kill path");
  assert(r.args.includes("--no-audio"), "toggle-audio applies --no-audio");
  assert(r.afterKill?.forceRecord === true, "forceRecord survives audio restart kill");
  assert(r.afterKill?.enableAudio === false, "enableAudio stored through kill");

  r = simulateRestartScrcpySessionOrder(store, preserve, id, {
    forceCamera: true,
  });
  assert(r.args.includes("--record"), "toggle-camera keeps --record after kill path");
  assert(r.args.includes("--video-source=camera"), "camera source set");
  assert(r.afterKill?.forceRecord === true, "forceRecord survives camera restart kill");
  assert(r.afterKill?.enableAudio === false, "enableAudio survives camera restart");
}

// --- stop-recording suppresses auto-record across later audio toggle ---
{
  const store = new Map<string, DeviceSessionOverrides>();
  const preserve = new Set<string>();
  const id = "dev-auto";
  const displayAutoOn = { ...baseDisplay, record: true };

  simulateRestartScrcpySessionOrder(
    store,
    preserve,
    id,
    { forceRecord: true },
    displayAutoOn
  );

  let r = simulateRestartScrcpySessionOrder(
    store,
    preserve,
    id,
    { forceRecord: false },
    displayAutoOn
  );
  assert(!r.args.includes("--record"), "stop-recording forces no --record");
  assert(r.afterKill?.forceRecord === false, "forceRecord false survives kill");

  r = simulateRestartScrcpySessionOrder(
    store,
    preserve,
    id,
    { enableAudio: true },
    displayAutoOn
  );
  assert(
    !r.args.includes("--record"),
    "toggle-audio after stop does not re-enable auto-record"
  );
}

// --- natural exit (no preserve) clears session ---
{
  const store = new Map<string, DeviceSessionOverrides>();
  const preserve = new Set<string>();
  const id = "dev-natural";
  beginIntentionalRestart(preserve, store, id, { forceRecord: true });
  endIntentionalRestart(preserve, id); // process fully up, preserve off
  const cleared = onProcessExitMaybeClearSession(preserve, store, id);
  assert(cleared === true, "natural exit clears session");
  assert(!store.has(id), "store empty after natural exit");
}

// --- buggy order loses forceRecord (proves why begin-before-kill is required) ---
{
  const store = new Map<string, DeviceSessionOverrides>();
  const preserve = new Set<string>();
  const id = "dev-buggy";
  // prior session recording
  beginIntentionalRestart(preserve, store, id, { forceRecord: true });
  endIntentionalRestart(preserve, id);

  const session = simulateBuggyKillThenMerge(store, preserve, id, {
    enableAudio: false,
  });
  endIntentionalRestart(preserve, id);
  assert(
    session.forceRecord !== true,
    "buggy kill-then-merge loses forceRecord (documents required order)"
  );
  assert(session.enableAudio === false, "buggy path only has audio patch");
}

// --- clear + reconnect auto-record ---
{
  const store = new Map<string, DeviceSessionOverrides>();
  const preserve = new Set<string>();
  const id = "dev-clear";
  beginIntentionalRestart(preserve, store, id, { forceRecord: false });
  endIntentionalRestart(preserve, id);
  clearSessionOverrides(store, id);
  assert(!store.has(id), "explicit clear removes entry");

  const r = simulateRestartScrcpySessionOrder(
    store,
    preserve,
    id,
    {},
    { ...baseDisplay, record: true }
  );
  assert(r.args.includes("--record"), "after clear, auto-record applies");
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
