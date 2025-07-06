import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';

export interface MidiDevice {
  id: number;
  name: string;
}

export interface MidiMessage {
  data: Uint8Array;
  timestamp: number;
}

export function useMidi() {
  const host = useStore((s) => s.settings.host);
  const port = useStore((s) => s.settings.port);
  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const [status, setStatus] = useState<'connected' | 'closed' | 'connecting'>('connecting');
  const launchpad = useRef<number | null>(null);
  const listeners = useRef(new Set<(msg: MidiMessage) => void>());
  const wsRef = useRef<WebSocket | null>(null);



  useEffect(() => {
    setStatus('connecting');
    const ws = new WebSocket(`ws://${host}:${port}`);
    wsRef.current = ws;
    ws.onopen = () => {
      setStatus('connected');
      ws.send(JSON.stringify({ type: 'getDevices' }));
    };
    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload.type === 'devices') {
          setInputs(payload.inputs);
          setOutputs(payload.outputs);
          const lp = payload.outputs.find((o: MidiDevice) =>
            o.name.includes('Launchpad X'),
          );
          launchpad.current = lp ? lp.id : null;
        } else if (payload.type === 'midi') {
          const msg: MidiMessage = {
            data: new Uint8Array(payload.message),
            timestamp: payload.time,
          };
          for (const fn of listeners.current) fn(msg);
        }
      } catch (err) {
        console.error(err);
      }
    };
    ws.onclose = () => setStatus('closed');
    ws.onerror = () => setStatus('closed');
    return () => {
      ws.close();
    };
  }, [host, port]);

  const send = useCallback(
    (bytes: number[] | Uint8Array, output?: MidiDevice | null) => {
      const port = output?.id ?? launchpad.current ?? 0;
      try {
        wsRef.current?.send(
          JSON.stringify({ type: 'send', port, bytes: Array.from(bytes) }),
        );
      } catch (err) {
        console.error(err);
      }
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
    status,
  };
}
