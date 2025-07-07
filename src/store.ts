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
  padLabels: Record<string, string>;
  padChannels: Record<string, number>;
  setPadColour: (id: string, colour: string) => void;
  setPadColours: (colours: Record<string, string>) => void;
  setPadLabel: (id: string, label: string) => void;
  setPadLabels: (labels: Record<string, string>) => void;
  setPadChannel: (id: string, channel: number) => void;
  setPadChannels: (channels: Record<string, number>) => void;
}

export interface PadConfig {
  id: string;
  name: string;
  padColours: Record<string, string>;
  padLabels?: Record<string, string>;
  padChannels?: Record<string, number>;
}

interface ConfigsSlice {
  configs: PadConfig[];
  addConfig: (c: PadConfig) => void;
  updateConfig: (c: PadConfig) => void;
  removeConfig: (id: string) => void;
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
    pingEnabled: boolean;
    clearBeforeLoad: boolean;
    clock: number[];
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
  setPingEnabled: (enabled: boolean) => void;
  setClearBeforeLoad: (enabled: boolean) => void;
  setClock: (data: number[]) => void;
}

type StoreState = DevicesSlice &
  MacrosSlice &
  PadsSlice &
  SettingsSlice &
  ConfigsSlice;

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
      padLabels: {},
      padChannels: {},
      setPadColour: (id, colour) =>
        set((state) => ({ padColours: { ...state.padColours, [id]: colour } })),
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
      configs: [],
      addConfig: (c) => set((s) => ({ configs: [...s.configs, c] })),
      updateConfig: (c) =>
        set((s) => ({
          configs: s.configs.map((p) => (p.id === c.id ? c : p)),
        })),
      removeConfig: (id) =>
        set((s) => ({ configs: s.configs.filter((p) => p.id !== id) })),
      settings: {
        host: location.hostname || 'localhost',
        port: 3000,
        autoReconnect: true,
        reconnectInterval: 2000,
        maxReconnectAttempts: 10,
        logLimit: 9999,
        pingInterval: 15000,
        pingGreen: 10,
        pingYellow: 50,
        pingOrange: 250,
        pingEnabled: true,
        clearBeforeLoad: false,
        clock: [0xf8],
      },
      setHost: (h) =>
        set((state) => ({ settings: { ...state.settings, host: h } })),
      setPort: (p) =>
        set((state) => ({ settings: { ...state.settings, port: p } })),
      setAutoReconnect: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, autoReconnect: enabled },
        })),
      setReconnectInterval: (interval) =>
        set((state) => ({
          settings: {
            ...state.settings,
            reconnectInterval: Math.max(1000, interval), // Minimum 1 second
          },
        })),
      setMaxReconnectAttempts: (max) =>
        set((state) => ({
          settings: {
            ...state.settings,
            maxReconnectAttempts: Math.min(99, Math.max(1, max)),
          },
        })),
      setLogLimit: (limit) =>
        set((state) => ({
          settings: {
            ...state.settings,
            logLimit: Math.min(9999, Math.max(1, limit)),
          },
        })),
      setPingInterval: (interval) =>
        set((state) => ({
          settings: {
            ...state.settings,
            pingInterval: Math.max(500, interval),
          },
        })),
      setPingGreen: (ms) =>
        set((state) => ({
          settings: {
            ...state.settings,
            pingGreen: Math.max(0, ms),
          },
        })),
      setPingYellow: (ms) =>
        set((state) => ({
          settings: {
            ...state.settings,
            pingYellow: Math.max(0, ms),
          },
        })),
      setPingOrange: (ms) =>
        set((state) => ({
          settings: {
            ...state.settings,
            pingOrange: Math.max(0, ms),
          },
        })),
      setPingEnabled: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            pingEnabled: enabled,
          },
        })),
      setClearBeforeLoad: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, clearBeforeLoad: enabled },
        })),
      setClock: (data) =>
        set((state) => ({
          settings: { ...state.settings, clock: data },
        })),
    }),
    {
      name: 'store',
      storage: createJSONStorage(() => idbStorage),
      merge: (persisted: unknown, current: StoreState): StoreState => {
        const p = persisted as Partial<StoreState>;
        return {
          ...current,
          ...p,
          settings: {
            ...current.settings,
            ...p.settings,
            clock: p.settings?.clock ?? current.settings.clock,
          },
        };
      },
    },
  ),
);
