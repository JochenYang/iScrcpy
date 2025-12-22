import { create } from "zustand";

interface Device {
  id: string;
  name: string;
  type: "usb" | "wifi";
  status: string;
}

interface DeviceStore {
  devices: Device[];
  mirroringDevices: Set<string>; // Devices currently mirroring
  recordingDevices: Set<string>; // Devices currently recording
  audioEnabledDevices: Set<string>; // Devices with audio enabled
  setDevices: (devices: Device[]) => void;
  addMirroringDevice: (deviceId: string) => void;
  removeMirroringDevice: (deviceId: string) => void;
  addRecordingDevice: (deviceId: string) => void;
  removeRecordingDevice: (deviceId: string) => void;
  setAudioEnabled: (deviceId: string, enabled: boolean) => void;
  isDeviceMirroring: (deviceId: string) => boolean;
  isDeviceRecording: (deviceId: string) => boolean;
  isAudioEnabled: (deviceId: string) => boolean;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  mirroringDevices: new Set<string>(),
  recordingDevices: new Set<string>(),
  audioEnabledDevices: new Set<string>(),

  setDevices: (devices) => set({ devices }),

  addMirroringDevice: (deviceId) =>
    set((state) => ({
      mirroringDevices: new Set([...state.mirroringDevices, deviceId]),
    })),

  removeMirroringDevice: (deviceId) =>
    set((state) => {
      const newSet = new Set(state.mirroringDevices);
      newSet.delete(deviceId);
      return { mirroringDevices: newSet };
    }),

  addRecordingDevice: (deviceId) =>
    set((state) => ({
      recordingDevices: new Set([...state.recordingDevices, deviceId]),
    })),

  removeRecordingDevice: (deviceId) =>
    set((state) => {
      const newSet = new Set(state.recordingDevices);
      newSet.delete(deviceId);
      return { recordingDevices: newSet };
    }),

  setAudioEnabled: (deviceId, enabled) =>
    set((state) => {
      const newSet = new Set(state.audioEnabledDevices);
      if (enabled) {
        newSet.add(deviceId);
      } else {
        newSet.delete(deviceId);
      }
      return { audioEnabledDevices: newSet };
    }),

  isDeviceMirroring: (deviceId) => get().mirroringDevices.has(deviceId),
  isDeviceRecording: (deviceId) => get().recordingDevices.has(deviceId),
  isAudioEnabled: (deviceId) => get().audioEnabledDevices.has(deviceId),
}));
