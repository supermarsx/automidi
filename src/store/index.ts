import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createStore as createIdbStore,
  get as idbGet,
  set as idbSet,
  del as idbDel,
} from 'idb-keyval';

import { createDevicesSlice, type DevicesSlice } from './devices';
import { createMacrosSlice, type MacrosSlice, type Macro, type MacroType } from './macros';
import {
  createPadsSlice,
  type PadsSlice,
  type PadColourMap,
  type PadActions,
} from './pads';
import { createConfigsSlice, type ConfigsSlice, type PadConfig } from './configs';
import { createSettingsSlice, type SettingsSlice } from './settings';

export type StoreState = DevicesSlice &
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
    (set, get) => ({
      ...createDevicesSlice(set, get),
      ...createMacrosSlice(set, get),
      ...createPadsSlice(set, get),
      ...createConfigsSlice(set, get),
      ...createSettingsSlice(set, get),
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

export type { Macro, MacroType, PadColourMap, PadActions, PadConfig };
