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
    maxReconnectAttempts: number;
    logLimit: number;
    pingInterval: number;
    pingGreen: number;
    pingYellow: number;
    pingOrange: number;
  };
  setHost: (h: string) => void;
  setPort: (p: number) => void;
  setAutoReconnect: (enabled: boolean) => void;
  setReconnectInterval: (interval: number) => void;
  setMaxReconnectAttempts: (max: number) => void;
  setLogLimit: (limit: number) => void;
  setPingInterval: (interval: number) => void;
  setPingGreen: (ms: number) => void;
  setPingYellow: (ms: number) => void;
  setPingOrange: (ms: number) => void;
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
        reconnectInterval: 2000,
        maxReconnectAttempts: 10,
        logLimit: 999,
        pingInterval: 15000,
        pingGreen: 10,
        pingYellow: 50,
        pingOrange: 250
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
      setMaxReconnectAttempts: (max) => set((state) => ({
        settings: {
          ...state.settings,
          maxReconnectAttempts: Math.min(99, Math.max(1, max))
        }
      })),
      setLogLimit: (limit) => set((state) => ({
        settings: {
          ...state.settings,
          logLimit: Math.min(999, Math.max(1, limit))
        }
      })),
      setPingInterval: (interval) => set((state) => ({
        settings: {
          ...state.settings,
          pingInterval: Math.max(1000, interval)
        }
      })),
      setPingGreen: (ms) => set((state) => ({
        settings: {
          ...state.settings,
          pingGreen: Math.max(0, ms)
        }
      })),
      setPingYellow: (ms) => set((state) => ({
        settings: {
          ...state.settings,
          pingYellow: Math.max(0, ms)
        }
      })),
      setPingOrange: (ms) => set((state) => ({
        settings: {
          ...state.settings,
          pingOrange: Math.max(0, ms)
        }
      })),
    }),
    {
      name: 'store',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);