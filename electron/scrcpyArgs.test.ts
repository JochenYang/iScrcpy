/**
 * Unit tests for shipped buildScrcpyArgs (must import the real module).
 * Run: npx tsx electron/scrcpyArgs.test.ts
 */
import {
  buildScrcpyArgs,
  argvContainsRecordAudio,
  argvUsesCameraSource,
  type ScrcpyDisplaySettings,
  type ScrcpyEncodingSettings,
  type ScrcpyServerSettings,
} from "./scrcpyArgs";

const baseDisplay: ScrcpyDisplaySettings = {
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
  recordAudio: true, // legacy setting must not produce --record-audio
};

const baseEncoding: ScrcpyEncodingSettings = {
  videoCodec: "h264",
  videoEncoder: "",
  audioCodec: "opus",
  bitrateMode: "cbr",
  ignoreVideoEncoderConstraints: false,
};

const baseServer: ScrcpyServerSettings = {
  tunnelMode: "reverse",
  cleanup: true,
};

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

function assertIncludes(args: string[], token: string, message: string) {
  assert(args.includes(token) || args.some((a) => a.includes(token)), message);
}

function assertNotIncludes(args: string[], token: string, message: string) {
  assert(!args.includes(token) && !args.some((a) => a === token || a.startsWith(token + "=")), message);
}

console.log("scrcpyArgs tests\n");

// 1. Screen mirror baseline
{
  const args = buildScrcpyArgs({
    deviceId: "ABC123",
    display: baseDisplay,
    encoding: baseEncoding,
    server: baseServer,
  });
  assert(args[0] === "-s" && args[1] === "ABC123", "includes serial");
  assert(!argvUsesCameraSource(args), "screen path does not force camera source");
  assert(!argvContainsRecordAudio(args), "no --record-audio on baseline");
  assertNotIncludes(args, "--record-audio", "no record-audio token");
  assertNotIncludes(args, "--video-source=camera", "no camera source on screen path");
}

// 2. recordAudio true + session/auto record must never emit --record-audio
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: { ...baseDisplay, record: true, recordAudio: true },
    encoding: baseEncoding,
    server: baseServer,
    resolvedRecordPath: "C:\\out\\rec.mp4",
  });
  assertIncludes(args, "--record", "auto-record adds --record");
  assertIncludes(args, "C:\\out\\rec.mp4", "record path present");
  assert(!argvContainsRecordAudio(args), "recordAudio setting does not emit --record-audio");
}

// 3. Session forceRecord true without mutating display.record preference concept
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: { ...baseDisplay, record: false },
    encoding: baseEncoding,
    server: baseServer,
    forceRecord: true,
    resolvedRecordPath: "/tmp/session.mp4",
  });
  assertIncludes(args, "--record", "session forceRecord records");
  assert(!argvContainsRecordAudio(args), "session record has no --record-audio");
}

// 4. forceRecord false suppresses auto-record
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: { ...baseDisplay, record: true },
    encoding: baseEncoding,
    server: baseServer,
    forceRecord: false,
    resolvedRecordPath: "/tmp/x.mp4",
  });
  assertNotIncludes(args, "--record", "forceRecord false skips record");
}

// 5. Camera via display.camera
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: { ...baseDisplay, camera: true, cameraId: "0", cameraSize: "1280x720", cameraFps: 60 },
    encoding: baseEncoding,
    server: baseServer,
  });
  assert(argvUsesCameraSource(args), "display.camera uses camera video source");
  assertIncludes(args, "--video-source=camera", "explicit --video-source=camera");
  assertIncludes(args, "--camera-id", "camera id");
  assertIncludes(args, "1280x720", "camera size");
}

// 6. Screen path when forceCamera false even if display.camera true
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: { ...baseDisplay, camera: true },
    encoding: baseEncoding,
    server: baseServer,
    forceCamera: false,
  });
  assert(!argvUsesCameraSource(args), "forceCamera false keeps screen source");
}

// 7. Independent cameraOnly
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: baseDisplay,
    encoding: baseEncoding,
    server: baseServer,
    cameraOnly: true,
  });
  assert(argvUsesCameraSource(args), "cameraOnly uses camera source");
  assertIncludes(args, "--camera-facing=back", "default facing when no cameraId");
}

// 8. Audio off
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: { ...baseDisplay, enableAudio: true },
    encoding: baseEncoding,
    server: baseServer,
    enableAudio: false,
  });
  assertIncludes(args, "--no-audio", "enableAudio override false");
}

// 9. bitrateMode must not leak into argv
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: baseDisplay,
    encoding: { ...baseEncoding, bitrateMode: "cbr" },
    server: baseServer,
  });
  assert(
    !args.some((a) => /bitrate|cbr|vbr/i.test(a)),
    "bitrateMode not emitted as scrcpy flag"
  );
}

// 10. encoding extras
{
  const args = buildScrcpyArgs({
    deviceId: "dev1",
    display: baseDisplay,
    encoding: {
      videoCodec: "h265",
      videoEncoder: "c2.test.encoder",
      audioCodec: "aac",
      ignoreVideoEncoderConstraints: true,
    },
    server: { tunnelMode: "forward", cleanup: false },
  });
  assertIncludes(args, "--video-codec", "h265 codec");
  assertIncludes(args, "c2.test.encoder", "video encoder");
  assertIncludes(args, "--ignore-video-encoder-constraints", "ignore constraints");
  assertIncludes(args, "--audio-codec", "aac");
  assertIncludes(args, "--tunnel-forward", "forward tunnel");
  assertIncludes(args, "--no-cleanup", "no cleanup");
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
