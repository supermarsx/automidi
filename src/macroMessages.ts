import type { Macro, MacroType } from './store/macros';

export interface MacroMessage {
  type: string;
  payload: (macro: Macro) => Record<string, unknown>;
}

export const MACRO_MESSAGES: Record<MacroType, MacroMessage> = {
  app: {
    type: 'runApp',
    payload: (m) => ({ app: m.command }),
  },
  shell: {
    type: 'runShell',
    payload: (m) => ({ cmd: m.command }),
  },
  shell_win: {
    type: 'runShellWin',
    payload: (m) => ({ cmd: m.command }),
  },
  shell_bg: {
    type: 'runShellBg',
    payload: (m) => ({ cmd: m.command }),
  },
  keys: {
    type: 'keysType',
    payload: (m) => ({ sequence: m.sequence, interval: m.interval }),
  },
};
