import { type StateCreator } from 'zustand';
import type { StoreState } from './index';

export type PadColourMap = Record<number, string>;

export interface PadActions {
  noteOn?: string;
  noteOff?: string;
  confirm?: boolean;
  confirmToast?: boolean;
}

export interface PadsSlice {
  padColours: Record<string, PadColourMap>;
  padLabels: Record<string, string>;
  padChannels: Record<string, number>;
  padActions: Record<string, PadActions>;
  setPadColour: (id: string, colour: string, channel: number) => void;
  setPadColours: (colours: Record<string, PadColourMap>) => void;
  setPadLabel: (id: string, label: string) => void;
  setPadLabels: (labels: Record<string, string>) => void;
  setPadChannel: (id: string, channel: number) => void;
  setPadChannels: (channels: Record<string, number>) => void;
  setPadAction: (id: string, actions: PadActions) => void;
  setPadActions: (actions: Record<string, PadActions>) => void;
}

export const createPadsSlice: StateCreator<
  StoreState,
  [],
  [],
  PadsSlice
> = (set) => ({
  padColours: {},
  padLabels: {},
  padChannels: {},
  padActions: {},
  setPadColour: (id, colour, channel) =>
    set((state) => ({
      padColours: {
        ...state.padColours,
        [id]: { ...state.padColours[id], [channel]: colour },
      },
    })),
  setPadColours: (colours) => set(() => ({ padColours: { ...colours } })),
  setPadLabel: (id, label) =>
    set((state) => ({ padLabels: { ...state.padLabels, [id]: label } })),
  setPadLabels: (labels) => set(() => ({ padLabels: { ...labels } })),
  setPadChannel: (id, channel) =>
    set((state) => ({
      padChannels: { ...state.padChannels, [id]: channel },
    })),
  setPadChannels: (channels) =>
    set(() => ({ padChannels: { ...channels } })),
  setPadAction: (id, actions) =>
    set((state) => ({
      padActions: { ...state.padActions, [id]: actions },
    })),
  setPadActions: (actions) => set(() => ({ padActions: { ...actions } })),
});
