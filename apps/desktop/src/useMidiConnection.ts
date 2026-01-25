import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ClientMessage,
  MidiDevice,
  ServerMessage,
} from '@shared/messages';

import { registerSend } from './socket';
import { isTauriRuntime } from './tauriFiles';
import { usePing } from './usePing';
import { useStore } from './store';
import { useToastStore } from './toastStore';

export type RawMessage = ServerMessage;
export type RawListener = (msg: RawMessage) => void;

export function useMidiConnection() {
  const pingInterval = useStore((s) => s.settings.pingInterval);
  const pingEnabled = useStore((s) => s.settings.pingEnabled);
  const reconnectOnLost = useStore((s) => s.settings.reconnectOnLost);
  const addToast = useToastStore((s) => s.addToast);
  const listeners = useRef(new Set<RawListener>());
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connected' | 'closed' | 'connecting'>(
    'closed',
  );

  const isTauri = isTauriRuntime();

  const {
    pingDelay,
    handlePong,
    start: startPing,
    stop: stopPing,
  } = usePing(wsRef, pingEnabled, pingInterval, reconnectOnLost);

  const emitMessage = useCallback((msg: ServerMessage) => {
    for (const fn of listeners.current) fn(msg);
  }, []);

  const listen = useCallback((fn: RawListener) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const send = useCallback(
    (msg: ClientMessage) => {
      if (!isTauri) return false;
      const run = async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        switch (msg.type) {
          case 'send':
            await invoke('midiSend', {
              portId: msg.port,
              bytes: msg.bytes,
            });
            break;
          case 'getDevices': {
            const devices = await invoke<{
              inputs: MidiDevice[];
              outputs: MidiDevice[];
            }>('midiListDevices');
            emitMessage({
              type: 'devices',
              inputs: devices.inputs ?? [],
              outputs: devices.outputs ?? [],
            });
            break;
          }
          case 'ping': {
            const pong = await invoke<number>('ping', { ts: msg.ts });
            emitMessage({ type: 'pong', ts: pong });
            break;
          }
          case 'notify':
            await invoke('notify', { title: msg.title, message: msg.message });
            break;
          case 'runApp':
            await invoke('runApp', { appPath: msg.app });
            break;
          case 'runShell':
            await invoke('runShell', { cmd: msg.cmd });
            break;
          case 'runShellWin':
            await invoke('runShellWin', { cmd: msg.cmd });
            break;
          case 'runShellBg':
            await invoke('runShellBg', { cmd: msg.cmd });
            break;
          case 'keysType':
            await invoke('keysType', {
              sequence: msg.sequence,
              interval: msg.interval,
            });
            break;
        }
      };
      run().catch((err) => console.error('Tauri send failed', err));
      return true;
    },
    [emitMessage, isTauri],
  );

  const reconnect = useCallback(() => {
    if (!isTauri) return;
    setStatus('connected');
  }, [isTauri]);

  useEffect(() => {
    if (!pingEnabled) stopPing();
  }, [pingEnabled, stopPing]);

  useEffect(() => {
    if (status === 'connected') startPing();
    else stopPing();
  }, [status, startPing, stopPing]);

  useEffect(() => {
    const unsub = listen((payload) => {
      if (payload.type === 'pong') {
        handlePong(payload.ts);
      } else if (payload.type === 'shellOutput') {
        addToast(
          payload.data,
          payload.stream === 'stderr' ? 'error' : 'success',
        );
      }
    });
    return unsub;
  }, [listen, handlePong, addToast]);

  useEffect(() => stopPing, [stopPing]);

  useEffect(() => {
    if (!isTauri) {
      setStatus('closed');
      return;
    }
    setStatus('connected');

    let cancelled = false;
    const unsubs: Array<() => void> = [];

    const setup = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('midiSetListening', { enabled: true });
        const devices = await invoke<{
          inputs: MidiDevice[];
          outputs: MidiDevice[];
        }>('midiListDevices');
        if (!cancelled) {
          emitMessage({
            type: 'devices',
            inputs: devices.inputs ?? [],
            outputs: devices.outputs ?? [],
          });
        }
      } catch (err) {
        console.error('Failed to init MIDI listener', err);
      }

      try {
        const { listen: tauriListen } = await import(
          '@tauri-apps/api/event',
        );
        unsubs.push(
          await tauriListen('midi:event', (event) => {
            if (!cancelled) emitMessage(event.payload as ServerMessage);
          }),
        );
        unsubs.push(
          await tauriListen('midi:devices', (event) => {
            if (!cancelled) emitMessage(event.payload as ServerMessage);
          }),
        );
        unsubs.push(
          await tauriListen('shell:output', (event) => {
            if (!cancelled) emitMessage(event.payload as ServerMessage);
          }),
        );
      } catch (err) {
        console.error('Failed to register Tauri listeners', err);
      }
    };

    setup();

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [emitMessage, isTauri]);

  useEffect(() => {
    registerSend((data: unknown) => send(data as ClientMessage));
  }, [send]);

  return { status, pingDelay, send, listen, reconnect, wsRef };
}
