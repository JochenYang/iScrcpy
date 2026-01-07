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
  mirroringDevices: Set<string>;
  recordingDevices: Set<string>;
  audioEnabledDevices: Set<string>;
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
    }),
    {
      name: "device-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        knownDevices: state.knownDevices.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
        })),
        removedDevices: state.removedDevices.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
        })),
      }),
    }
  )
);
