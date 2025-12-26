import { create } from "zustand";

interface Device {
  id: string;
  name: string;
  type: "usb" | "wifi";
  status: string;
  lastSeen?: number; // Timestamp when last seen
}

interface DeviceStore {
  devices: Device[];
  knownDevices: Device[]; // All devices ever seen (persist across disconnections)
  mirroringDevices: Set<string>; // Devices currently mirroring
  recordingDevices: Set<string>; // Devices currently recording
  audioEnabledDevices: Set<string>; // Devices with audio enabled
  updateKnownDevice: (device: Device) => void; // Update or add device to known list
  removeKnownDevice: (deviceId: string) => void; // Remove device from known list
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
  knownDevices: [],
  mirroringDevices: new Set<string>(),
  recordingDevices: new Set<string>(),
  audioEnabledDevices: new Set<string>(),

  updateKnownDevice: (device) => {
    const knownDevices = get().knownDevices;
    const existingIndex = knownDevices.findIndex(d => d.id === device.id);
    const updatedKnown = [...knownDevices];
    
    if (existingIndex >= 0) {
      updatedKnown[existingIndex] = { ...device, lastSeen: Date.now() };
    } else {
      updatedKnown.push({ ...device, lastSeen: Date.now() });
    }
    
    set({ knownDevices: updatedKnown });
  },

  removeKnownDevice: (deviceId) => {
    set((state) => ({
      knownDevices: state.knownDevices.filter(d => d.id !== deviceId),
    }));
  },

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
