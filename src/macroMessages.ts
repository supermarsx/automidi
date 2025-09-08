import type { Macro, MacroType } from './store/macros';
import type { ClientMessage } from '../shared/messages';

export interface MacroMessage {
  type: ClientMessage['type'];
  payload: (macro: Macro) => Omit<ClientMessage, 'type'>;
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
  midi: {
    type: 'send',
    payload: () => ({ port: '', bytes: [] }),
  },
};
