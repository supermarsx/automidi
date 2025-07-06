import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createStore as createIdbStore,
  get as idbGet,
  set as idbSet,
  del as idbDel,
} from 'idb-keyval';

export type MidiMsg = {
  ts: number;
  bytes: number[];
};

export interface Macro {
  id: string;
  name: string;
  messages: MidiMsg[];
}

interface DevicesSlice {
  devices: {
    inputId: string | null;
    outputId: string | null;
  };
  setInputId: (id: string | null) => void;
  setOutputId: (id: string | null) => void;
}

interface MacrosSlice {
  macros: Macro[];
  addMacro: (macro: Macro) => void;
  updateMacro: (macro: Macro) => void;
  removeMacro: (id: string) => void;
}

interface PadsSlice {
  padColours: Record<string, string>;
  setPadColour: (id: string, colour: string) => void;
}

interface SettingsSlice {
  settings: {
    host: string;
    port: number;
    autoReconnect: boolean;
    reconnectInterval: number;
  };
  setHost: (h: string) => void;
  setPort: (p: number) => void;
  setAutoReconnect: (enabled: boolean) => void;
  setReconnectInterval: (interval: number) => void;
}

type StoreState = DevicesSlice & MacrosSlice & PadsSlice & SettingsSlice;

const kvStore = createIdbStore('automidi-db', 'state');

const idbStorage = {
  getItem: (name: string) => idbGet(name, kvStore),
  setItem: (name: string, value: string) => idbSet(name, value, kvStore),
  removeItem: (name: string) => idbDel(name, kvStore),
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      devices: { inputId: null, outputId: null },
      setInputId: (id) =>
        set((state) => ({ devices: { ...state.devices, inputId: id } })),
      setOutputId: (id) =>
        set((state) => ({ devices: { ...state.devices, outputId: id } })),
      macros: [],
      addMacro: (macro) =>
        set((state) => ({ macros: [...state.macros, macro] })),
      updateMacro: (macro) =>
        set((state) => ({
          macros: state.macros.map((m) => (m.id === macro.id ? macro : m)),
        })),
      removeMacro: (id) =>
        set((state) => ({ macros: state.macros.filter((m) => m.id !== id) })),
      padColours: {},
      setPadColour: (id, colour) =>
        set((state) => ({ padColours: { ...state.padColours, [id]: colour } })),
      settings: { 
        host: location.hostname || 'localhost', 
        port: 3000,
        autoReconnect: true,
        reconnectInterval: 2000
      },
      setHost: (h) => set((state) => ({ settings: { ...state.settings, host: h } })),
      setPort: (p) => set((state) => ({ settings: { ...state.settings, port: p } })),
      setAutoReconnect: (enabled) => set((state) => ({ settings: { ...state.settings, autoReconnect: enabled } })),
      setReconnectInterval: (interval) => set((state) => ({ 
        settings: { 
          ...state.settings, 
          reconnectInterval: Math.max(1000, interval) // Minimum 1 second
        } 
      })),
    }),
    {
      name: 'store',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);