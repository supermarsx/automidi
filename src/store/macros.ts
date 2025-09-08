import { type StateCreator } from 'zustand';
import type { StoreState } from './index';

export type MacroType =
  | 'keys'
  | 'app'
  | 'shell'
  | 'shell_win'
  | 'shell_bg'
  | 'midi';

export interface Macro {
  id: string;
  name: string;
  sequence?: string[];
  interval?: number;
  type?: MacroType;
  command?: string;
  midiData?: number[][];
  nextId?: string;
  tags?: string[];
}

export interface MacrosSlice {
  macros: Macro[];
  addMacro: (macro: Macro) => void;
  updateMacro: (macro: Macro) => void;
  removeMacro: (id: string) => void;
  reorderMacro: (from: number, to: number) => void;
}

export const createMacrosSlice: StateCreator<
  StoreState,
  [],
  [],
  MacrosSlice
> = (set) => ({
  macros: [],
  addMacro: (macro) => set((state) => ({ macros: [...state.macros, macro] })),
  updateMacro: (macro) =>
    set((state) => ({
      macros: state.macros.map((m) => (m.id === macro.id ? macro : m)),
    })),
  removeMacro: (id) =>
    set((state) => ({ macros: state.macros.filter((m) => m.id !== id) })),
  reorderMacro: (from, to) =>
    set((state) => {
      const macros = [...state.macros];
      if (from < 0 || from >= macros.length || to < 0 || to >= macros.length)
        return { macros };
      const [m] = macros.splice(from, 1);
      macros.splice(to, 0, m);
      return { macros };
    }),
});
