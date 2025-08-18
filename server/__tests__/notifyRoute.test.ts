import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';

describe('notify route', () => {
  const API_KEY = 'test-key';
  let server: Server;
  let stopServer: () => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tn = require('toasted-notifier');
    vi.spyOn(tn, 'notify').mockImplementation(
      (_opts: unknown, cb: (err: Error | null) => void) => {
        cb(new Error('fail'));
      },
    );
    process.env.API_KEY = API_KEY;
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
    stopServer = mod.stopServer;
  });

  afterEach(async () => {
    await stopServer();
    vi.clearAllMocks();
  });

  it('returns 500 when notification fails', async () => {
    const agent = request(server);
    await agent
      .post('/notify')
      .set('x-api-key', API_KEY)
      .send({ message: 'hi' })
      .expect(500);
  });
});
