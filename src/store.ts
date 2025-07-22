import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createStore as createIdbStore,
  get as idbGet,
  set as idbSet,
  del as idbDel,
} from 'idb-keyval';

export type MacroType = 'keys' | 'app' | 'shell' | 'shell_win' | 'shell_bg';

export interface Macro {
  id: string;
  name: string;
  sequence?: string[];
  interval?: number;
  type?: MacroType;
  command?: string;
  nextId?: string;
  tags?: string[];
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
  reorderMacro: (from: number, to: number) => void;
}

export type PadColourMap = Record<number, string>;

export interface PadActions {
  noteOn?: string;
  noteOff?: string;
  confirm?: boolean;
  confirmToast?: boolean;
}

interface PadsSlice {
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

export interface PadConfig {
  id: string;
  name: string;
  padColours: Record<string, PadColourMap>;
  padLabels?: Record<string, string>;
  padChannels?: Record<string, number>;
  padActions?: Record<string, PadActions>;
  tags?: string[];
}

interface ConfigsSlice {
  configs: PadConfig[];
  addConfig: (c: PadConfig) => void;
  updateConfig: (c: PadConfig) => void;
  removeConfig: (id: string) => void;
  reorderConfig: (from: number, to: number) => void;
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
    reconnectOnLost: boolean;
    clearBeforeLoad: boolean;
    sysexColorMode: boolean;
    autoSleep: number;
    theme: 'default' | 'dark' | 'light';
    autoLoadFirstConfig: boolean;
    apiKey: string;
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
  setReconnectOnLost: (enabled: boolean) => void;
  setClearBeforeLoad: (enabled: boolean) => void;
  setSysexColorMode: (enabled: boolean) => void;
  setAutoSleep: (s: number) => void;
  setTheme: (t: 'default' | 'dark' | 'light') => void;
  setAutoLoadFirstConfig: (b: boolean) => void;
  setApiKey: (k: string) => void;
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
      reorderMacro: (from, to) =>
        set((state) => {
          const macros = [...state.macros];
          if (
            from < 0 ||
            from >= macros.length ||
            to < 0 ||
            to >= macros.length
          )
            return { macros };
          const [m] = macros.splice(from, 1);
          macros.splice(to, 0, m);
          return { macros };
        }),
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
      configs: [],
      addConfig: (c) => set((s) => ({ configs: [...s.configs, c] })),
      updateConfig: (c) =>
        set((s) => ({
          configs: s.configs.map((p) => (p.id === c.id ? c : p)),
        })),
      removeConfig: (id) =>
        set((s) => ({ configs: s.configs.filter((p) => p.id !== id) })),
      reorderConfig: (from, to) =>
        set((s) => {
          const configs = [...s.configs];
          if (
            from < 0 ||
            from >= configs.length ||
            to < 0 ||
            to >= configs.length
          )
            return { configs };
          const [c] = configs.splice(from, 1);
          configs.splice(to, 0, c);
          return { configs };
        }),
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
        reconnectOnLost: true,
        clearBeforeLoad: false,
        sysexColorMode: false,
        autoSleep: 0,
        theme: 'default',
        autoLoadFirstConfig: false,
        apiKey: '',
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
      setReconnectOnLost: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, reconnectOnLost: enabled },
        })),
      setClearBeforeLoad: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, clearBeforeLoad: enabled },
        })),
      setSysexColorMode: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, sysexColorMode: enabled },
        })),
      setAutoSleep: (s) =>
        set((state) => ({
          settings: { ...state.settings, autoSleep: Math.max(0, s) },
        })),
      setTheme: (t) =>
        set((state) => ({
          settings: { ...state.settings, theme: t },
        })),
      setAutoLoadFirstConfig: (b) =>
        set((state) => ({
          settings: { ...state.settings, autoLoadFirstConfig: b },
        })),
      setApiKey: (k) =>
        set((state) => ({ settings: { ...state.settings, apiKey: k } })),
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
        const migratedColours: Record<string, PadColourMap> = {};
        if (p.padColours) {
          for (const [id, val] of Object.entries(
            p.padColours as Record<string, PadColourMap | string>,
          )) {
            migratedColours[id] =
              typeof val === 'string' ? { 1: val } : (val as PadColourMap);
          }
        }
        const macros = (p.macros || current.macros).map((m) => ({
          ...m,
          tags: m.tags ?? [],
        }));
        const configs = (p.configs || current.configs).map((c) => ({
          ...c,
          tags: c.tags ?? [],
        }));
        return {
          ...current,
          ...p,
          macros,
          configs,
          padColours: Object.keys(migratedColours).length
            ? migratedColours
            : current.padColours,
          settings: {
            ...current.settings,
            ...p.settings,
            clock: p.settings?.clock ?? current.settings.clock,
            sysexColorMode:
              p.settings?.sysexColorMode ?? current.settings.sysexColorMode,
            autoSleep: p.settings?.autoSleep ?? current.settings.autoSleep,
            theme: p.settings?.theme ?? current.settings.theme,
            autoLoadFirstConfig:
              p.settings?.autoLoadFirstConfig ??
              current.settings.autoLoadFirstConfig,
            reconnectOnLost:
              p.settings?.reconnectOnLost ?? current.settings.reconnectOnLost,
            apiKey: p.settings?.apiKey ?? current.settings.apiKey,
          },
        };
      },
    },
  ),
);
