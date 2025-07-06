import { create } from 'zustand';
import type { MidiMessage } from './useMidi';

export interface LogEntry extends MidiMessage {
  id: number;
  formattedTime: string;
}

interface LogStoreState {
  logs: LogEntry[];
  addMessage: (msg: MidiMessage) => void;
  clearLogs: () => void;
}

let idCounter = 0;

export const useLogStore = create<LogStoreState>((set) => ({
  logs: [],
  addMessage: (msg) => {
    const entry: LogEntry = {
      ...msg,
      id: idCounter++,
      formattedTime: new Date(msg.timestamp).toLocaleTimeString(),
    };
    set((state) => ({ logs: [...state.logs.slice(-199), entry] }));
  },
  clearLogs: () => set({ logs: [] }),
}));
