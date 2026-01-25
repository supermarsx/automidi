import { type StateCreator } from 'zustand';
import type { StoreState } from './index';
import type { PadColourMap, PadActions } from './pads';

export interface PadConfig {
  id: string;
  name: string;
  padColours: Record<string, PadColourMap>;
  padLabels?: Record<string, string>;
  padChannels?: Record<string, number>;
  padActions?: Record<string, PadActions>;
  tags?: string[];
}

export interface ConfigsSlice {
  configs: PadConfig[];
  addConfig: (c: PadConfig) => void;
  updateConfig: (c: PadConfig) => void;
  removeConfig: (id: string) => void;
  reorderConfig: (from: number, to: number) => void;
}

export const createConfigsSlice: StateCreator<
  StoreState,
  [],
  [],
  ConfigsSlice
> = (set) => ({
  configs: [],
  addConfig: (c) => set((s) => ({ configs: [...s.configs, c] })),
  updateConfig: (c) =>
    set((s) => ({ configs: s.configs.map((p) => (p.id === c.id ? c : p)) })),
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
});
