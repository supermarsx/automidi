import { useCallback, useEffect, useRef, useState } from 'react';

const base = `http://${location.hostname}:3000`;

export interface MidiDevice {
  id: number;
  name: string;
}

export interface MidiMessage {
  data: Uint8Array;
  timestamp: number;
}

export function useMidi() {
  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const launchpad = useRef<number | null>(null);
  const listeners = useRef(new Set<(msg: MidiMessage) => void>());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    const update = () => {
      fetch(`${base}/midi/devices`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setInputs(data.inputs);
          setOutputs(data.outputs);
          const lp = data.outputs.find((o: MidiDevice) =>
            o.name.includes('Launchpad X'),
          );
          launchpad.current = lp ? lp.id : null;
        })
        .catch((err) => {
          console.error(err);
        });
    };

    update();
    const id = setInterval(update, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`ws://${location.hostname}:3000`);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        const msg: MidiMessage = {
          data: new Uint8Array(payload.message),
          timestamp: payload.time,
        };
        for (const fn of listeners.current) fn(msg);
      } catch (err) {
        console.error(err);
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  const send = useCallback(
    (bytes: number[] | Uint8Array, output?: MidiDevice | null) => {
      const port = output?.id ?? launchpad.current ?? 0;
      fetch(`${base}/midi/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, data: Array.from(bytes) }),
      }).catch((err) => {
        console.error(err);
      });
    },
    [],
  );

  const listen = useCallback((handler: (msg: MidiMessage) => void) => {
    listeners.current.add(handler);
    return () => {
      listeners.current.delete(handler);
    };
  }, []);

  const enterProgrammer = useCallback(() => {
    send([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x01, 0xf7]);
  }, [send]);

  const returnToLive = useCallback(() => {
    send([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x00, 0xf7]);
  }, [send]);

  useEffect(() => {
    if (launchpad.current !== null) {
      enterProgrammer();
    }
  }, [outputs, enterProgrammer]);

  return {
    inputs,
    outputs,
    send,
    listen,
    returnToLive,
  };
}
