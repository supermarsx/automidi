import { exec, spawn } from 'child_process';
import { isValidCmd } from '../validate.js';
import type { MessageHandler } from './types.js';

const handleRunApp: MessageHandler = (_ws, data, ctx) => {
  const { app: appPath } = data;
  if (!appPath) return;
  if (!isValidCmd(appPath, ctx.allowedCmds)) return;
  exec(`"${appPath}"`, (err) => {
    if (err) console.error('App exec error:', err);
  });
};

const handleRunShell: MessageHandler = (_ws, data, ctx) => {
  const { cmd } = data;
  if (!cmd) return;
  if (!isValidCmd(cmd, ctx.allowedCmds)) return;
  exec(cmd, (err) => {
    if (err) console.error('Shell exec error:', err);
  });
};

const handleRunShellWin: MessageHandler = (_ws, data, ctx) => {
  const { cmd } = data;
  if (!cmd) return;
  if (!isValidCmd(cmd, ctx.allowedCmds)) return;
  try {
    const child = spawn(cmd, {
      shell: true,
      detached: true,
      windowsHide: false,
    });
    child.unref();
  } catch (err) {
    console.error('ShellWin spawn error:', err);
  }
};

const handleRunShellBg: MessageHandler = (_ws, data, ctx) => {
  const { cmd } = data;
  if (!cmd) return;
  if (!isValidCmd(cmd, ctx.allowedCmds)) return;
  exec(cmd, { windowsHide: true }, (err) => {
    if (err) console.error('ShellBg exec error:', err);
  });
};

export { handleRunApp, handleRunShell, handleRunShellWin, handleRunShellBg };
