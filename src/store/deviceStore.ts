import { create } from "zustand";

interface Device {
  id: string;
  name: string;
  type: "usb" | "wifi";
  status: string;
}

interface DeviceStore {
  devices: Device[];
  connectedDevices: Set<string>;
  setDevices: (devices: Device[]) => void;
  addConnectedDevice: (deviceId: string) => void;
  removeConnectedDevice: (deviceId: string) => void;
  isDeviceConnected: (deviceId: string) => boolean;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  connectedDevices: new Set<string>(),

  setDevices: (devices) => set({ devices }),

  addConnectedDevice: (deviceId) =>
    set((state) => ({
      connectedDevices: new Set([...state.connectedDevices, deviceId]),
    })),

  removeConnectedDevice: (deviceId) =>
    set((state) => {
      const newSet = new Set(state.connectedDevices);
      newSet.delete(deviceId);
      return { connectedDevices: newSet };
    }),

  isDeviceConnected: (deviceId) => get().connectedDevices.has(deviceId),
}));
