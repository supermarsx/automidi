import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { WebMidi } from 'webmidi';
import keySender from 'node-key-sender';
import notifier from 'toasted-notifier';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import crypto from 'crypto';

import { isValidCmd } from './validate.js';

const envKey = process.env.API_KEY;
const API_KEY =
  envKey === undefined ? crypto.randomBytes(16).toString('hex') : envKey;
if (process.env.LOG_API_KEY === 'true') {
  console.log('API key:', API_KEY);
} else if (API_KEY) {
  console.log('Server started with API key set.');
} else {
  console.log('Server started with no API key required.');
}

const allowedCmds = (process.env.ALLOWED_CMDS || '')
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean);

const app = express();
app.use(express.json());
app.use(cors());

function checkKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'];
  if (API_KEY && key !== API_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

app.use(checkKey);

async function startServer() {
  try {
    await WebMidi.enable({ sysex: true });
    console.log('WebMidi enabled successfully (with SysEx)');

    function listDevices() {
      const inputs = WebMidi.inputs.map((input) => ({
        id: input.id,
        name: input.name,
        manufacturer: input.manufacturer,
        state: input.state,
      }));
      const outputs = WebMidi.outputs.map((output) => ({
        id: output.id,
        name: output.name,
        manufacturer: output.manufacturer,
        state: output.state,
      }));
      return { inputs, outputs };
    }

    // Initialize device list
    listDevices();

    app.get('/midi/devices', (_req, res) => {
      res.json(listDevices());
    });

    app.post('/midi/send', (req, res) => {
      const { port = '', data } = req.body || {};
      if (!Array.isArray(data)) {
        res.status(400).json({ error: 'data must be an array of numbers' });
        return;
      }
      const out = WebMidi.getOutputById(String(port));
      if (!out) {
        res.status(404).json({ error: `output port ${port} not found` });
        return;
      }
      try {
        out.send(data);
        console.log(`Sent MIDI to ${out.name}:`, data);
        res.json({ ok: true });
      } catch (err) {
        console.error('MIDI send error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // Deprecated REST routes retained for backwards compatibility
    // Prefer using WebSocket messages instead of these endpoints
    app.post('/notify', (req, res) => {
      const { title = 'Automidi', message } = req.body || {};
      if (!message) {
        res.status(400).json({ error: 'message is required' });
        return;
      }
      notifier.notify({ title, message }, (err) => {
        if (err) console.error('Notification error:', err);
      });
      res.json({ ok: true });
    });

    app.post('/keys/type', async (req, res) => {
      const { sequence = [], interval = 50 } = req.body || {};
      if (!Array.isArray(sequence)) {
        res.status(400).json({ error: 'sequence must be an array of keys' });
        return;
      }
      try {
        for (const key of sequence) {
          await keySender.sendKey(key);
          if (interval > 0) {
            await new Promise((r) => setTimeout(r, interval));
          }
        }
        res.json({ ok: true });
      } catch (err) {
        console.error('Key send error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    const server = app.listen(process.env.PORT || 3000, () => {
      const addr = server.address();
      const port = typeof addr === 'string' ? addr : addr?.port;
      console.log(`Server listening on port ${port}`);
    });

    const wss = new WebSocketServer({
      server,
      verifyClient: (info, done) => {
        const url = new URL(info.req.url || '', 'http://localhost');
        if (API_KEY && url.searchParams.get('key') !== API_KEY) {
          done(false, 401, 'Unauthorized');
        } else {
          done(true);
        }
      },
    });

    function broadcastToClients(message) {
      const payload = JSON.stringify(message);
      for (const ws of wss.clients) {
        if (ws.readyState === ws.OPEN) {
          ws.send(payload);
        }
      }
    }

    function sendDevices(ws?: WebSocket) {
      const devices = listDevices();
      const message = { type: 'devices', ...devices };
      if (ws) {
        ws.send(JSON.stringify(message));
      } else {
        broadcastToClients(message);
      }
    }

    // Remove all listeners from every input
    function cleanupMidiListeners() {
      WebMidi.inputs.forEach((input) => {
        input.removeListener();
      });
    }

    // Set up MIDI input listeners for all devices
    function setupMidiListeners() {
      cleanupMidiListeners();
      WebMidi.inputs.forEach((input) => {
        console.log(`Setting up listener for input: ${input.name}`);

        // Listen to all MIDI messages
        input.addListener('midimessage', (e) => {
          const bytes = Array.from(e.message.data || e.data || []);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message: any = {
            type: 'midi',
            direction: 'in',
            message: bytes,
            timestamp: e.timestamp || Date.now(),
            source: input.name,
            port: input.id,
          };
          // For aftertouch messages (poly or channel), capture the pressure
          if (
            bytes.length >= 3 &&
            ((bytes[0] & 0xf0) === 0xa0 || (bytes[0] & 0xf0) === 0xd0)
          ) {
            message.pressure = bytes[2];
          }
          console.log('MIDI IN:', message);
          broadcastToClients(message);
        });

        // Listen to specific message types for better logging
        input.addListener('noteon', (e) => {
          console.log(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            `Note ON from ${input.name}: ${e.note.name}${e.note.octave} vel:${(e as any).velocity}`,
          );
        });

        input.addListener('noteoff', (e) => {
          console.log(
            `Note OFF from ${input.name}: ${e.note.name}${e.note.octave}`,
          );
        });

        input.addListener('controlchange', (e) => {
          console.log(
            `CC from ${input.name}: CC${e.controller.number} val:${e.value}`,
          );
        });
      });
    }

    // Initial setup
    setupMidiListeners();

    wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      sendDevices(ws);

      ws.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          console.log('Received WebSocket message:', data);

          if (data.type === 'getDevices') {
            sendDevices(ws);
          } else if (data.type === 'send') {
            const { port = '', bytes } = data;
            const out = WebMidi.getOutputById(String(port));
            if (!out || !Array.isArray(bytes)) {
              console.error('Invalid output port or bytes:', { port, bytes });
              return;
            }
            try {
              out.send(bytes);
              console.log(`Sent MIDI via WebSocket to ${out.name}:`, bytes);

              // Broadcast the outgoing message to all clients for logging
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const outMsg: any = {
                type: 'midi',
                direction: 'out',
                message: bytes,
                timestamp: Date.now(),
                target: out.name,
                port: port,
              };
              if (
                bytes.length >= 3 &&
                ((bytes[0] & 0xf0) === 0xa0 || (bytes[0] & 0xf0) === 0xd0)
              ) {
                outMsg.pressure = bytes[2];
              }
              broadcastToClients(outMsg);
            } catch (err) {
              console.error('WebSocket MIDI send error:', err);
            }
          } else if (data.type === 'runApp') {
            const { app: appPath } = data;
            if (!appPath) return;
            if (!isValidCmd(appPath, allowedCmds)) return;
            exec(`"${appPath}"`, (err) => {
              if (err) console.error('App exec error:', err);
            });
          } else if (data.type === 'runShell') {
            const { cmd } = data;
            if (!cmd) return;
            if (!isValidCmd(cmd, allowedCmds)) return;
            exec(cmd, (err) => {
              if (err) console.error('Shell exec error:', err);
            });
          } else if (data.type === 'runShellWin') {
            const { cmd } = data;
            if (!cmd) return;
            if (!isValidCmd(cmd, allowedCmds)) return;
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
          } else if (data.type === 'runShellBg') {
            const { cmd } = data;
            if (!cmd) return;
            if (!isValidCmd(cmd, allowedCmds)) return;
            exec(cmd, { windowsHide: true }, (err) => {
              if (err) console.error('ShellBg exec error:', err);
            });
          } else if (data.type === 'keysType') {
            const { sequence = [], interval = 50 } = data;
            (async () => {
              try {
                for (const key of sequence) {
                  await keySender.sendKey(key);
                  if (interval > 0)
                    await new Promise((r) => setTimeout(r, interval));
                }
              } catch (err) {
                console.error('Key send error:', err);
              }
            })();
          } else if (data.type === 'notify') {
            const { title = 'Automidi', message } = data;
            if (!message) return;
            notifier.notify({ title, message }, (err) => {
              if (err) console.error('Notification error:', err);
            });
          } else if (data.type === 'ping') {
            ws.send(
              JSON.stringify({ type: 'pong', ts: data.ts || Date.now() }),
            );
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });

    // Listen for device changes
    WebMidi.addListener('portschanged', () => {
      console.log('MIDI ports changed');
      cleanupMidiListeners();
      listDevices();
      setupMidiListeners(); // Re-setup listeners for new devices
      sendDevices(); // Broadcast to all clients
    });
    return server;
  } catch (err) {
    console.error('Failed to enable WebMidi:', err);
  }
}

if (require.main === module) {
  startServer();
}

export { app, startServer };
