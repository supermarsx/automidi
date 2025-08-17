import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import WebSocket from 'ws';
import { isValidCmd } from '../dist/validate.js';
import type { Server } from 'http';
import type {
  RunAppMessage,
  RunShellMessage,
  RunShellWinMessage,
  RunShellBgMessage,
} from '../../shared/messages';

describe('shell routes', () => {
  const API_KEY = 'test-key';
  const ALLOW = 'echo,win,app';
  let server: Server;
  let exec: Mock;
  let spawn: Mock;
  let originalExec: unknown;
  let originalSpawn: unknown;

  beforeEach(async () => {
    vi.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require('child_process');
    originalExec = cp.exec;
    originalSpawn = cp.spawn;
    exec = vi.fn(
      (_cmd: string, optsOrCb?: unknown, cb?: (err: unknown) => void) => {
        const callback =
          typeof optsOrCb === 'function'
            ? optsOrCb
            : (cb as (err: unknown) => void);
        if (callback) callback(null);
      },
    );
    spawn = vi.fn(() => ({ unref: vi.fn() }));
    cp.exec = exec;
    cp.spawn = spawn;
    process.env.API_KEY = API_KEY;
    process.env.ALLOWED_CMDS = ALLOW;
    process.env.PORT = '0';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wm = require('webmidi');
    wm.WebMidi.enable = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(wm.WebMidi, 'inputs', {
      value: [],
      configurable: true,
    });
    Object.defineProperty(wm.WebMidi, 'outputs', {
      value: [],
      configurable: true,
    });
    wm.WebMidi.addListener = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../dist/index.js');
    server = await mod.startServer();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require('child_process');
    cp.exec = originalExec as typeof cp.exec;
    cp.spawn = originalSpawn as typeof cp.spawn;
    server.close();
    vi.clearAllMocks();
  });

  it('executes allowed commands', async () => {
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://localhost:${port}?key=${API_KEY}`);
    await new Promise((r) => ws.on('open', r));

    const m1: RunAppMessage = { type: 'runApp', app: 'app' };
    const m2: RunShellMessage = { type: 'runShell', cmd: 'echo hi' };
    const m3: RunShellWinMessage = {
      type: 'runShellWin',
      cmd: 'win something',
    };
    const m4: RunShellBgMessage = { type: 'runShellBg', cmd: 'echo hi' };
    ws.send(JSON.stringify(m1));
    ws.send(JSON.stringify(m2));
    ws.send(JSON.stringify(m3));
    ws.send(JSON.stringify(m4));

    expect(isValidCmd('app', ALLOW.split(','))).toBe(true);
    expect(isValidCmd('echo hi', ALLOW.split(','))).toBe(true);
    expect(isValidCmd('win something', ALLOW.split(','))).toBe(true);

    await new Promise((r) => setTimeout(r, 10));

    expect(exec).toHaveBeenCalledWith('"app"', expect.any(Function));
    expect(exec).toHaveBeenCalledWith('echo hi', expect.any(Function));
    expect(spawn).toHaveBeenCalledWith('win something', {
      shell: true,
      detached: true,
      windowsHide: false,
    });
    expect(exec).toHaveBeenCalledWith(
      'echo hi',
      { windowsHide: true },
      expect.any(Function),
    );
    ws.close();
  });

  it('rejects disallowed commands', async () => {
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://localhost:${port}?key=${API_KEY}`);
    await new Promise((r) => ws.on('open', r));

    const m5: RunShellMessage = { type: 'runShell', cmd: 'rm -rf /' };
    const m6: RunShellWinMessage = { type: 'runShellWin', cmd: 'malicious' };
    ws.send(JSON.stringify(m5));
    ws.send(JSON.stringify(m6));

    expect(isValidCmd('rm -rf /', ALLOW.split(','))).toBe(false);
    expect(isValidCmd('malicious', ALLOW.split(','))).toBe(false);

    await new Promise((r) => setTimeout(r, 10));

    expect(exec).not.toHaveBeenCalled();
    expect(spawn).not.toHaveBeenCalled();
    ws.close();
  });
});
