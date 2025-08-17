import { type StateCreator } from 'zustand';
import type { StoreState } from './index';

export interface SettingsSlice {
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

export const createSettingsSlice: StateCreator<
  StoreState,
  [],
  [],
  SettingsSlice
> = (set) => ({
  settings: {
    host: typeof location === 'undefined' ? 'localhost' : location.hostname || 'localhost',
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
        reconnectInterval: Math.max(1000, interval),
      },
    })),
  setMaxReconnectAttempts: (max) =>
    set((state) => ({
      settings: {
        ...state.settings,
        maxReconnectAttempts: Math.min(99, Math.max(0, max)),
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
      settings: { ...state.settings, pingGreen: Math.max(0, ms) },
    })),
  setPingYellow: (ms) =>
    set((state) => ({
      settings: { ...state.settings, pingYellow: Math.max(0, ms) },
    })),
  setPingOrange: (ms) =>
    set((state) => ({
      settings: { ...state.settings, pingOrange: Math.max(0, ms) },
    })),
  setPingEnabled: (enabled) =>
    set((state) => ({
      settings: { ...state.settings, pingEnabled: enabled },
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
    set((state) => ({ settings: { ...state.settings, theme: t } })),
  setAutoLoadFirstConfig: (b) =>
    set((state) => ({
      settings: { ...state.settings, autoLoadFirstConfig: b },
    })),
  setApiKey: (k) =>
    set((state) => ({ settings: { ...state.settings, apiKey: k } })),
  setClock: (data) =>
    set((state) => ({ settings: { ...state.settings, clock: data } })),
});
