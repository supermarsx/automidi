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

describe('shell routes', () => {
  const API_KEY = 'test-key';
  const ALLOW = 'echo,win,app';
  let server: Server;
  let spawn: Mock;
  let originalSpawn: unknown;

  beforeEach(async () => {
    vi.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require('child_process');
    originalSpawn = cp.spawn;
    spawn = vi.fn(() => ({ on: vi.fn(), unref: vi.fn() }));
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
    cp.spawn = originalSpawn as typeof cp.spawn;
    server.close();
    vi.clearAllMocks();
  });

  it('executes allowed commands', async () => {
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://localhost:${port}?key=${API_KEY}`);
    await new Promise((r) => ws.on('open', r));

    ws.send(JSON.stringify({ type: 'runApp', app: 'app' }));
    ws.send(JSON.stringify({ type: 'runShell', cmd: 'echo hi' }));
    ws.send(JSON.stringify({ type: 'runShellWin', cmd: 'win something' }));
    ws.send(JSON.stringify({ type: 'runShellBg', cmd: 'echo hi' }));

    expect(isValidCmd('app', ALLOW.split(','))).toBe(true);
    expect(isValidCmd('echo hi', ALLOW.split(','))).toBe(true);
    expect(isValidCmd('win something', ALLOW.split(','))).toBe(true);

    await new Promise((r) => setTimeout(r, 10));

    expect(spawn).toHaveBeenCalledWith(
      'app',
      [],
      expect.objectContaining({ shell: false, detached: true }),
    );
    expect(spawn).toHaveBeenCalledWith(
      'echo',
      ['hi'],
      expect.objectContaining({ shell: false }),
    );
    expect(spawn).toHaveBeenCalledWith(
      'win',
      ['something'],
      expect.objectContaining({
        shell: false,
        detached: true,
        windowsHide: false,
      }),
    );
    expect(spawn).toHaveBeenCalledWith(
      'echo',
      ['hi'],
      expect.objectContaining({
        shell: false,
        windowsHide: true,
        detached: true,
      }),
    );
    ws.close();
  });

  it('rejects disallowed commands', async () => {
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://localhost:${port}?key=${API_KEY}`);
    await new Promise((r) => ws.on('open', r));

    ws.send(JSON.stringify({ type: 'runShell', cmd: 'rm -rf /' }));
    ws.send(JSON.stringify({ type: 'runShellWin', cmd: 'malicious' }));

    expect(isValidCmd('rm -rf /', ALLOW.split(','))).toBe(false);
    expect(isValidCmd('malicious', ALLOW.split(','))).toBe(false);

    await new Promise((r) => setTimeout(r, 10));

    expect(spawn).not.toHaveBeenCalled();
    ws.close();
  });
});
