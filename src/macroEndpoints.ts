import type { Macro, MacroType } from './store';

export interface MacroEndpoint {
  url: string;
  body: (macro: Macro) => Record<string, unknown>;
}

export const MACRO_ENDPOINTS: Record<MacroType, MacroEndpoint> = {
  app: {
    url: '/run/app',
    body: (m) => ({ app: m.command }),
  },
  shell: {
    url: '/run/shell',
    body: (m) => ({ cmd: m.command }),
  },
  shell_win: {
    url: '/run/shellWin',
    body: (m) => ({ cmd: m.command }),
  },
  shell_bg: {
    url: '/run/shellBg',
    body: (m) => ({ cmd: m.command }),
  },
  keys: {
    url: '/keys/type',
    body: (m) => ({ sequence: m.sequence, interval: m.interval }),
  },
};
