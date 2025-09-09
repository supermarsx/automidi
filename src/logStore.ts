import { create } from 'zustand';
import type { MidiMessage } from './useMidi';
import { useStore } from './store';

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
    const limit = useStore.getState().settings.logLimit || 9999;
    set((state) => ({ logs: [...state.logs.slice(-(limit - 1)), entry] }));
  },
  clearLogs: () => set({ logs: [] }),
}));

export function serializeLogs(logs: LogEntry[]) {
  return JSON.stringify(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logs.map(({ id, formattedTime, ...rest }) => rest),
  );
}
