import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

describe('shell routes', () => {
  const API_KEY = 'test-key';
  const ALLOW = 'echo,win,app';
  let app: Express;
  let exec: Mock;
  let spawn: Mock;
  let originalExec: unknown;
  let originalSpawn: unknown;

  beforeEach(() => {
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    app = require('../index.cjs');
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require('child_process');
    cp.exec = originalExec as typeof cp.exec;
    cp.spawn = originalSpawn as typeof cp.spawn;
  });

  it('executes allowed commands', async () => {
    await request(app)
      .post('/run/app')
      .set('x-api-key', API_KEY)
      .send({ app: 'app' })
      .expect(200);
    expect(exec).toHaveBeenCalledWith('"app"', expect.any(Function));

    await request(app)
      .post('/run/shell')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'echo hi' })
      .expect(200);
    expect(exec).toHaveBeenCalledWith('echo hi', expect.any(Function));

    await request(app)
      .post('/run/shellWin')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'win something' })
      .expect(200);
    expect(spawn).toHaveBeenCalledWith('win something', {
      shell: true,
      detached: true,
      windowsHide: false,
    });

    await request(app)
      .post('/run/shellBg')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'echo hi' })
      .expect(200);
    expect(exec).toHaveBeenCalledWith(
      'echo hi',
      { windowsHide: true },
      expect.any(Function),
    );
  });

  it('rejects disallowed commands', async () => {
    await request(app)
      .post('/run/shell')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'rm -rf /' })
      .expect(403);
    expect(exec).not.toHaveBeenCalled();

    await request(app)
      .post('/run/shellWin')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'malicious' })
      .expect(403);
    expect(spawn).not.toHaveBeenCalled();
  });
});
