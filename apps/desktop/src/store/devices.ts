import { type StateCreator } from 'zustand';
import type { StoreState } from './index';

export interface DevicesSlice {
  devices: {
    inputId: string | null;
    outputId: string | null;
  };
  setInputId: (id: string | null) => void;
  setOutputId: (id: string | null) => void;
}

export const createDevicesSlice: StateCreator<
  StoreState,
  [],
  [],
  DevicesSlice
> = (set) => ({
  devices: { inputId: null, outputId: null },
  setInputId: (id) =>
    set((state) => ({ devices: { ...state.devices, inputId: id } })),
  setOutputId: (id) =>
    set((state) => ({ devices: { ...state.devices, outputId: id } })),
});
