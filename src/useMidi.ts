import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { useMidiConnection, type RawMessage } from './useMidiConnection';
import type { MidiDevice } from '../shared/messages';
import { isDevicesMessage, isMidiPayload } from './types';

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
      const targetPort = selectedOutput || launchpadRef.current;
      if (!targetPort) return false;
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
      if (isDevicesMessage(payload)) {
        setInputs(payload.inputs || []);
        setOutputs(payload.outputs || []);
        const launchpad = payload.outputs?.find((o: MidiDevice) =>
          o.name?.toLowerCase().includes('launchpad x'),
        );
        launchpadRef.current = launchpad ? launchpad.id : null;
      } else if (isMidiPayload(payload)) {
        const msg: MidiMessage = {
          direction: payload.direction,
          message: payload.message,
          timestamp: payload.timestamp,
          source: payload.source,
          target: payload.target,
          port: payload.port,
          pressure: payload.pressure,
        };
        for (const fn of listeners.current) fn(msg);
      }
    });
    return unsub;
  }, [listenRaw]);

  useEffect(() => {
    if (launchpadRef.current !== null && status === 'connected') {
      const timeoutId = setTimeout(() => {
        sendRef.current([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x01, 0xf7]);
      }, 1000);
      timeoutRef.current = timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutRef.current = null;
      };
    }
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
