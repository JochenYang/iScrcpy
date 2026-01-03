# iScrcpy User Guide

iScrcpy is an Android device mirroring tool based on [scrcpy](https://github.com/Genymobile/scrcpy), providing a clean GUI and rich customization options.

## Table of Contents

- [Quick Start](#quick-start)
- [Connecting Devices](#connecting-devices)
- [Display Settings](#display-settings)
- [Recording](#recording)
- [Window Settings](#window-settings)
- [Camera Mirroring](#camera-mirroring)
- [Encoding Settings](#encoding-settings)
- [FAQ](#faq)

---

## Quick Start

### System Requirements

- Windows 10/11
- Android 5.0+ device
- USB debugging enabled
- Or WiFi network connection

### First Use

1. Download and install iScrcpy
2. Connect your Android device to the computer
3. Authorize USB debugging on your device
4. Click "Start Mirroring" on the device card

---

## Connecting Devices

### USB Connection

1. Connect your phone to the computer using a USB cable
2. Tap "Allow" on the authorization prompt
3. The device will appear in the USB devices list
4. Click "Start Mirroring"

### WiFi Connection

**Method 1: Using TCP/IP Mode**

1. First connect via USB
2. Click "Enable WiFi" on the device card
3. Wait for the device IP to be obtained successfully
4. Disconnect USB and use WiFi connection

**Method 2: Manual Connection**

1. Ensure phone and computer are on the same network
2. Enable Developer Options → Network Debugging on your phone
3. Click "Add WiFi Device"
4. Enter the device IP address (e.g., `192.168.1.100:5555`)

---

## Display Settings

Go to the "Display" tab to configure:

### Video Settings

| Option | Description | Default |
|--------|-------------|---------|
| Max Resolution | Limit max video size | 1080p |
| Video Bitrate | Video encoding quality (Mbps) | 8 Mbps |
| Frame Rate | Max frame rate limit | 60 fps |
| Enable Video | Toggle video stream | On |
| Enable Audio | Toggle audio stream | On |

### Window Settings

| Option | Description |
|--------|-------------|
| Always on Top | Keep mirroring window on top |
| Fullscreen | Start in fullscreen mode |
| Stay Awake | Keep device screen on during mirroring |
| Borderless Mode | Hide window title bar and borders |
| Disable Screensaver | Prevent system sleep and screensaver |

---

## Recording

### Basic Recording

1. Click the red record button on the device card
2. Click again to stop recording
3. Videos are saved to the Downloads folder by default

### Auto Recording

In "Display" → "Recording Settings":

| Option | Description |
|--------|-------------|
| Auto Record | Automatically start recording on connect |
| Record Audio | Record audio along with video |
| Save Path | Custom save location |
| Time Limit | Recording duration limit (0 = unlimited) |

### Recording Formats

- Supports MP4, MKV, WEBM formats
- Video Codec: H.264 / H.265 / AV1
- Audio Codec: Opus / AAC

---

## Camera Mirroring

### Enable Camera Mirroring

1. Enable in "Display" → "Camera Settings"
2. Select camera resolution and frame rate
3. Click the camera button on the device card

### Camera Settings

| Option | Description |
|--------|-------------|
| Camera Resolution | 640x480 ~ 3840x2160 |
| Camera Frame Rate | 15 ~ 120 fps |

---

## Encoding Settings

Go to the "Encoding" tab for advanced encoding options:

### Video Codec

| Codec | Description |
|-------|-------------|
| H.264 | Default, best compatibility |
| H.265 | Higher compression, requires device support |
| AV1 | Latest codec, requires device support |

### Audio Codec

| Codec | Description |
|-------|-------------|
| Opus | Default, recommended |
| AAC | Better compatibility |

### Bitrate Mode

| Mode | Description |
|------|-------------|
| VBR | Variable bitrate, smaller files |
| CBR | Constant bitrate, better stability |

---

## Server Settings

Go to the "Server" tab:

### Tunnel Mode

- **Reverse Tunnel (default)**: Connect via `adb reverse`
- **Forward Tunnel**: Connect via `adb forward`

### Auto Cleanup

When enabled, automatically clean up scrcpy server processes when disconnecting.

---

## FAQ

### Q: Device not responding?

1. Check if the USB cable supports data transfer
2. Confirm USB debugging is enabled on the device
3. Try reconnecting the USB cable
4. Check if correct ADB drivers are installed

### Q: Mirroring is laggy?

1. Lower the max resolution
2. Reduce video bitrate
3. Lower the frame rate limit
4. Try using WiFi 5GHz network

### Q: No sound?

1. Check that audio is enabled in "Display" settings
2. Check computer volume settings
3. Some devices may not support audio transmission

### Q: Recording file corrupted?

1. Use the "Stop Recording" button to end normally
2. Avoid force disconnecting during recording
3. iScrcpy will automatically try to repair corrupted files

### Q: How to exit fullscreen?

Press `MOD+f` hotkey, or restart mirroring without fullscreen option.

---

## Hotkeys

| Hotkey | Function |
|--------|----------|
| `MOD+f` | Toggle fullscreen |
| `MOD+Left/Right` | Rotate screen |
| `MOD+g` | Toggle black screen |
| `MOD+r` | Toggle device rotation |
| `Ctrl+Click+Drag` | Simulate right click |
| `Scroll wheel` | Simulate volume buttons |

---

## Support

- GitHub: [https://github.com/JochenYang/iScrcpy](https://github.com/JochenYang/iScrcpy)
- Issue reporting: Please submit via GitHub Issues

---

## License

Licensed under the Apache License, Version 2.0
