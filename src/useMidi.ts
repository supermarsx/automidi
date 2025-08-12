import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { useMidiConnection, type RawMessage } from './useMidiConnection';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
  state?: string;
}

export interface MidiMessage {
  direction: 'in' | 'out';
  message: number[];
  timestamp: number;
  source?: string;
  target?: string;
  port?: string;
  pressure?: number;
}

export function useMidi() {
  const selectedOutput = useStore((s) => s.devices.outputId);
  const {
    status,
    pingDelay,
    send: sendRaw,
    listen: listenRaw,
    reconnect,
  } = useMidiConnection();

  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const launchpadRef = useRef<string | null>(null);
  const listeners = useRef(new Set<(msg: MidiMessage) => void>());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback(
    (bytes: number[] | Uint8Array) => {
      const targetPort = selectedOutput || launchpadRef.current || '';
      const bytesArray = Array.from(bytes);
      return sendRaw({ type: 'send', port: targetPort, bytes: bytesArray });
    },
    [selectedOutput, sendRaw],
  );

  const sendRef = useRef(send);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const listen = useCallback((handler: (msg: MidiMessage) => void) => {
    listeners.current.add(handler);
    return () => {
      listeners.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    const unsub = listenRaw((payload: RawMessage) => {
      if (payload.type === 'devices') {
        const dev = payload as {
          inputs?: MidiDevice[];
          outputs?: MidiDevice[];
        };
        setInputs(dev.inputs || []);
        setOutputs(dev.outputs || []);
        const launchpad = dev.outputs?.find((o: MidiDevice) =>
          o.name?.toLowerCase().includes('launchpad x'),
        );
        launchpadRef.current = launchpad ? launchpad.id : null;
      } else if (payload.type === 'midi') {
        const midi = payload as {
          direction?: 'in' | 'out';
          message?: number[];
          timestamp?: number;
          source?: string;
          target?: string;
          port?: string;
          pressure?: number;
        };
        const msg: MidiMessage = {
          direction: midi.direction || 'in',
          message: midi.message || [],
          timestamp: midi.timestamp || Date.now(),
          source: midi.source,
          target: midi.target,
          port: midi.port,
          pressure: midi.pressure,
        };
        for (const fn of listeners.current) fn(msg);
      }
    });
    return unsub;
  }, [listenRaw]);

  useEffect(() => {
    if (launchpadRef.current !== null && status === 'connected') {
      timeoutRef.current = setTimeout(() => {
        sendRef.current([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x01, 0xf7]);
      }, 1000);
    }
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [status]);

  return {
    inputs,
    outputs,
    send,
    listen,
    status,
    pingDelay,
    launchpadDetected: launchpadRef.current !== null,
    reconnect,
  };
}
