import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Device {
  id: string;
  name: string;
  type: "usb" | "wifi";
  status: string;
  lastSeen?: number;
}

interface DeviceStore {
  devices: Device[];
  knownDevices: Device[];
  removedDevices: Device[];
  mirroringDevices: string[];
  recordingDevices: string[];
  audioEnabledDevices: string[];
  updateKnownDevice: (device: Device) => void;
  removeKnownDevice: (deviceId: string) => void;
  addMirroringDevice: (deviceId: string) => void;
  removeMirroringDevice: (deviceId: string) => void;
  addRecordingDevice: (deviceId: string) => void;
  removeRecordingDevice: (deviceId: string) => void;
  setAudioEnabled: (deviceId: string, enabled: boolean) => void;
  isDeviceMirroring: (deviceId: string) => boolean;
  isDeviceRecording: (deviceId: string) => boolean;
  isAudioEnabled: (deviceId: string) => boolean;
}

export const useDeviceStore = create<DeviceStore>()(
  persist(
    (set, get) => ({
      devices: [],
      knownDevices: [],
      removedDevices: [],
      mirroringDevices: [],
      recordingDevices: [],
      audioEnabledDevices: [],

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
        set((state) => {
          const deviceToRemove = state.knownDevices.find(d => d.id === deviceId);
          const alreadyRemoved = state.removedDevices.some(d => d.id === deviceId);
          return {
            knownDevices: state.knownDevices.filter(d => d.id !== deviceId),
            removedDevices: deviceToRemove && !alreadyRemoved
              ? [...state.removedDevices, deviceToRemove]
              : state.removedDevices,
          };
        });
      },

      addMirroringDevice: (deviceId) =>
        set((state) => ({
          mirroringDevices: state.mirroringDevices.includes(deviceId)
            ? state.mirroringDevices
            : [...state.mirroringDevices, deviceId],
        })),

      removeMirroringDevice: (deviceId) =>
        set((state) => ({
          mirroringDevices: state.mirroringDevices.filter(id => id !== deviceId),
        })),

      addRecordingDevice: (deviceId) =>
        set((state) => ({
          recordingDevices: state.recordingDevices.includes(deviceId)
            ? state.recordingDevices
            : [...state.recordingDevices, deviceId],
        })),

      removeRecordingDevice: (deviceId) =>
        set((state) => ({
          recordingDevices: state.recordingDevices.filter(id => id !== deviceId),
        })),

      setAudioEnabled: (deviceId, enabled) =>
        set((state) => ({
          audioEnabledDevices: enabled
            ? state.audioEnabledDevices.includes(deviceId)
              ? state.audioEnabledDevices
              : [...state.audioEnabledDevices, deviceId]
            : state.audioEnabledDevices.filter(id => id !== deviceId),
        })),

      isDeviceMirroring: (deviceId) => get().mirroringDevices.includes(deviceId),
      isDeviceRecording: (deviceId) => get().recordingDevices.includes(deviceId),
      isAudioEnabled: (deviceId) => get().audioEnabledDevices.includes(deviceId),
    }),
    {
      name: "device-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        knownDevices: state.knownDevices.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          status: d.status,
        })),
        removedDevices: state.removedDevices.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          status: d.status,
        })),
      }),
    }
  )
);
