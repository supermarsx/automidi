import { handleGetDevices, handleSend } from './midi.js';
import {
  handleRunApp,
  handleRunShell,
  handleRunShellWin,
  handleRunShellBg,
} from './exec.js';
import { handleKeysType } from './keys.js';
import { handleNotify } from './notify.js';
import { handlePing } from './ping.js';
import type { MessageHandler } from './types.js';

const handlers: Record<string, MessageHandler> = {
  getDevices: handleGetDevices,
  send: handleSend,
  runApp: handleRunApp,
  runShell: handleRunShell,
  runShellWin: handleRunShellWin,
  runShellBg: handleRunShellBg,
  keysType: handleKeysType,
  notify: handleNotify,
  ping: handlePing,
};

export { handlers };
export type { MessageHandler, HandlerContext } from './types.js';
