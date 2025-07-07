const express = require('express');
const { WebSocketServer } = require('ws');
const { WebMidi } = require('webmidi');
const keySender = require('node-key-sender');
const notifier = require('toasted-notifier');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors());

let currentDevices = { inputs: [], outputs: [] };

WebMidi.enable({ sysex: true })
  .then(() => {
    console.log('WebMidi enabled successfully (with SysEx)');

    function listDevices() {
      const inputs = WebMidi.inputs.map((input, index) => ({
        id: index,
        name: input.name,
        manufacturer: input.manufacturer,
        state: input.state,
      }));
      const outputs = WebMidi.outputs.map((output, index) => ({
        id: index,
        name: output.name,
        manufacturer: output.manufacturer,
        state: output.state,
      }));
      currentDevices = { inputs, outputs };
      return { inputs, outputs };
    }

    // Initialize device list
    listDevices();

    app.get('/midi/devices', (_req, res) => {
      res.json(listDevices());
    });

    app.post('/midi/send', (req, res) => {
      const { port = 0, data } = req.body || {};
      if (!Array.isArray(data)) {
        res.status(400).json({ error: 'data must be an array of numbers' });
        return;
      }
      const out = WebMidi.outputs[port];
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

    app.post('/notify', (req, res) => {
      const { title = 'Automidi', message } = req.body || {};
      console.log('Notify request:', title, message);
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
      console.log('Keys type request:', sequence, interval);
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

    app.post('/run/app', (req, res) => {
      const { app: appPath } = req.body || {};
      console.log('Run app request:', appPath);
      if (!appPath) {
        res.status(400).json({ error: 'app path required' });
        return;
      }
      exec(`"${appPath}"`, (err) => {
        if (err) {
          console.error('App exec error:', err);
          res.status(500).json({ error: err.message });
        } else {
          res.json({ ok: true });
        }
      });
    });

    app.post('/run/shell', (req, res) => {
      const { cmd } = req.body || {};
      console.log('Run shell request:', cmd);
      if (!cmd) {
        res.status(400).json({ error: 'cmd required' });
        return;
      }
      exec(cmd, (err) => {
        if (err) {
          console.error('Shell exec error:', err);
          res.status(500).json({ error: err.message });
        } else {
          res.json({ ok: true });
        }
      });
    });

    const server = app.listen(process.env.PORT || 3000, () => {
      console.log(`Server listening on port ${server.address().port}`);
    });

    const wss = new WebSocketServer({ server });

    function broadcastToClients(message) {
      const payload = JSON.stringify(message);
      for (const ws of wss.clients) {
        if (ws.readyState === ws.OPEN) {
          ws.send(payload);
        }
      }
    }

    function sendDevices(ws) {
      const devices = listDevices();
      const message = { type: 'devices', ...devices };
      if (ws) {
        ws.send(JSON.stringify(message));
      } else {
        broadcastToClients(message);
      }
    }

    // Set up MIDI input listeners for all devices
    function setupMidiListeners() {
      WebMidi.inputs.forEach((input, index) => {
        console.log(`Setting up listener for input: ${input.name}`);

        // Listen to all MIDI messages
        input.addListener('midimessage', (e) => {
          const bytes = Array.from(e.message.data || e.data || []);
          const message = {
            type: 'midi',
            direction: 'in',
            message: bytes,
            timestamp: e.timestamp || Date.now(),
            source: input.name,
            port: index,
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
            `Note ON from ${input.name}: ${e.note.name}${e.note.octave} vel:${e.velocity}`,
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
            const { port = 0, bytes } = data;
            const out = WebMidi.outputs[port];
            if (!out || !Array.isArray(bytes)) {
              console.error('Invalid output port or bytes:', { port, bytes });
              return;
            }
            try {
              out.send(bytes);
              console.log(`Sent MIDI via WebSocket to ${out.name}:`, bytes);

              // Broadcast the outgoing message to all clients for logging
              const outMsg = {
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
      listDevices();
      setupMidiListeners(); // Re-setup listeners for new devices
      sendDevices(); // Broadcast to all clients
    });
  })
  .catch((err) => {
    console.error('Failed to enable WebMidi:', err);
  });
