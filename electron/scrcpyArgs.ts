/**
 * Pure scrcpy CLI argument builder (no Electron I/O).
 * Used by main-process launch paths and unit tests.
 *
 * Rules (see AGENTS.md):
 * - Never emit obsolete flags such as --record-audio (invalid on scrcpy 4.x).
 * - Camera video requires --video-source=camera.
 * - Session record is a per-call override; do not encode global auto-record mutation here.
 */

export interface ScrcpyDisplaySettings {
  maxSize: number;
  videoBitrate: number;
  frameRate: number;
  buffer?: number;
  alwaysOnTop: boolean;
  fullscreen: boolean;
  stayAwake: boolean;
  enableVideo: boolean;
  enableAudio: boolean;
  /** Persistent auto-record preference (used when forceRecord is undefined). */
  record: boolean;
  recordPath: string;
  recordTimeLimit: number;
  /** Prefer camera as video source when true (unless forceCamera overrides). */
  camera: boolean;
  cameraId: string;
  cameraSize: string;
  cameraFps: number;
  windowBorderless: boolean;
  disableScreensaver: boolean;
  /** Kept for settings compatibility; scrcpy 4.x has no --record-audio. */
  recordAudio?: boolean;
}

export interface ScrcpyEncodingSettings {
  videoCodec: string;
  videoEncoder?: string;
  audioCodec: string;
  audioEncoder?: string;
  /** UI may still store this; scrcpy 4.x has no simple CBR/VBR CLI flag — never emit. */
  bitrateMode?: string;
  ignoreVideoEncoderConstraints?: boolean;
}

export interface ScrcpyServerSettings {
  tunnelMode: string;
  cleanup: boolean;
}

export interface BuildScrcpyArgsOptions {
  deviceId: string;
  display: ScrcpyDisplaySettings;
  encoding: ScrcpyEncodingSettings;
  server: ScrcpyServerSettings;
  /**
   * Absolute or relative record file path (already resolved by caller).
   * Required when recording is enabled for this launch.
   */
  resolvedRecordPath?: string;
  /**
   * Session override: true force --record; false force no record;
   * undefined → use display.record (auto-record preference).
   */
  forceRecord?: boolean;
  /** Override enableAudio for this launch only (e.g. audio toggle). */
  enableAudio?: boolean;
  /**
   * Override camera video source for this launch.
   * undefined → use display.camera; true force camera; false force display.
   */
  forceCamera?: boolean;
  /**
   * Independent camera window: camera source + optional facing defaults.
   * Implies forceCamera=true and skips most display/window flags that conflict.
   */
  cameraOnly?: boolean;
}

function normalizeVideoCodec(videoCodec: string): string | null {
  if (!videoCodec || videoCodec === "h264" || videoCodec === "h264 (default)") {
    return null;
  }
  const lower = videoCodec.toLowerCase();
  if (lower.includes("h265") || lower.includes("hevc")) return "h265";
  if (lower.includes("av1")) return "av1";
  if (lower.includes("vp9")) return "vp9";
  if (lower.includes("vp8")) return "vp8";
  return videoCodec;
}

function shouldRecord(display: ScrcpyDisplaySettings, forceRecord?: boolean): boolean {
  if (forceRecord === true) return true;
  if (forceRecord === false) return false;
  return Boolean(display.record);
}

function shouldUseCamera(
  display: ScrcpyDisplaySettings,
  forceCamera?: boolean,
  cameraOnly?: boolean
): boolean {
  if (cameraOnly) return true;
  if (forceCamera === true) return true;
  if (forceCamera === false) return false;
  return Boolean(display.camera);
}

/**
 * Build scrcpy argv (without the executable path).
 * First args are always `-s <deviceId>` (except when deviceId empty — tests only).
 */
export function buildScrcpyArgs(options: BuildScrcpyArgsOptions): string[] {
  const { deviceId, display, encoding, server } = options;
  const args: string[] = [];

  if (deviceId) {
    args.push("-s", deviceId);
  }

  const cameraMode = shouldUseCamera(display, options.forceCamera, options.cameraOnly);
  const enableAudio =
    options.enableAudio !== undefined ? options.enableAudio : display.enableAudio;

  if (options.cameraOnly) {
    args.push("--video-source=camera");
    if (display.cameraId) {
      args.push("--camera-id", display.cameraId);
    } else {
      args.push("--camera-facing=back");
    }
    if (display.cameraSize) {
      args.push("--camera-size", display.cameraSize);
    }
    if (display.cameraFps && display.cameraFps !== 30) {
      args.push("--camera-fps", String(display.cameraFps));
    }
    if (server.tunnelMode === "forward") args.push("--tunnel-forward");
    if (server.cleanup === false) args.push("--no-cleanup");
    return args;
  }

  if (typeof display.maxSize === "number" && display.maxSize > 0) {
    args.push("--max-size", String(display.maxSize));
  }
  if (typeof display.videoBitrate === "number" && display.videoBitrate > 0) {
    args.push("--video-bit-rate", `${display.videoBitrate}M`);
  }
  if (typeof display.frameRate === "number" && display.frameRate > 0) {
    args.push("--max-fps", String(display.frameRate));
  }
  if (typeof display.buffer === "number" && display.buffer > 0) {
    args.push("--video-buffer", String(display.buffer));
  }
  if (display.alwaysOnTop) args.push("--always-on-top");
  if (display.fullscreen) args.push("--fullscreen");
  if (display.stayAwake) args.push("--stay-awake");
  if (display.windowBorderless) args.push("--window-borderless");
  if (display.disableScreensaver) args.push("--disable-screensaver");

  if (!display.enableVideo) args.push("--no-video");
  if (!enableAudio) args.push("--no-audio");

  if (shouldRecord(display, options.forceRecord)) {
    args.push("--record");
    args.push(options.resolvedRecordPath || "recording.mp4");
    // Intentionally no --record-audio (removed in scrcpy 4.x; audio follows enableAudio).
  }
  if (display.recordTimeLimit > 0 && shouldRecord(display, options.forceRecord)) {
    args.push("--time-limit", String(display.recordTimeLimit));
  }

  if (cameraMode) {
    args.push("--video-source=camera");
    if (display.cameraId) {
      args.push("--camera-id", display.cameraId);
    }
    if (display.cameraSize) {
      args.push("--camera-size", display.cameraSize);
    }
    if (display.cameraFps && display.cameraFps !== 30) {
      args.push("--camera-fps", String(display.cameraFps));
    }
  }

  const codec = normalizeVideoCodec(encoding.videoCodec);
  if (codec) {
    args.push("--video-codec", codec);
  }
  if (encoding.videoEncoder) {
    args.push("--video-encoder", encoding.videoEncoder);
  }
  if (encoding.ignoreVideoEncoderConstraints) {
    args.push("--ignore-video-encoder-constraints");
  }
  if (encoding.audioCodec && encoding.audioCodec !== "opus") {
    args.push("--audio-codec", encoding.audioCodec);
  }
  if (encoding.audioEncoder) {
    args.push("--audio-encoder", encoding.audioEncoder);
  }

  // bitrateMode is intentionally never mapped: scrcpy 4.x has no CBR/VBR CLI switch.

  if (server.tunnelMode === "forward") args.push("--tunnel-forward");
  if (server.cleanup === false) args.push("--no-cleanup");

  return args;
}

/** True if argv contains the obsolete --record-audio flag (should always be false for app builds). */
export function argvContainsRecordAudio(args: string[]): boolean {
  return args.some(
    (a) => a === "--record-audio" || a.startsWith("--record-audio=")
  );
}

/** True if argv selects camera video source. */
export function argvUsesCameraSource(args: string[]): boolean {
  return args.some(
    (a) =>
      a === "--video-source=camera" ||
      a === "camera" && args[args.indexOf(a) - 1] === "--video-source" ||
      a.startsWith("--video-source=camera")
  );
}
