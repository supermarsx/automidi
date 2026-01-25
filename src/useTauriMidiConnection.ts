import { useCallback, useEffect, useState, useRef } from 'react';
import { useStore } from './store';
import { useToastStore } from './toastStore';
import { isTauri, invoke, getTauriAPI } from './tauri';
import type {
  ClientMessage,
  ServerMessage,
  SetListeningMessage,
} from '../shared/messages';
import { registerSend } from './socket';

export type RawMessage = ServerMessage;
export type RawListener = (msg: RawMessage) => void;

type ConnectionStatus = 'connected' | 'closed' | 'connecting';

/**
 * Tauri-based MIDI connection hook
 * Replaces WebSocket with Tauri IPC and event system
 */
export function useTauriMidiConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('closed');
  const [pingDelay, setPingDelay] = useState<number | null>(null);
  const listenersRef = useRef<Set<RawListener>>(new Set());
  const unlistenFnsRef = useRef<Array<() => void>>([]);
  const addToast = useToastStore((s) => s.addToast);
  const pingInterval = useStore((s) => s.settings.pingInterval);
  const pingEnabled = useStore((s) => s.settings.pingEnabled);

  // Setup Tauri event listeners
  useEffect(() => {
    console.log('[useTauriMidiConnection] Starting setup, isTauri:', isTauri());
    if (!isTauri()) {
      console.log('[useTauriMidiConnection] Not in Tauri mode, setting status to closed');
      setStatus('closed');
      return;
    }

    console.log('[useTauriMidiConnection] Setting status to connecting');
    setStatus('connecting');

    const setupListeners = async () => {
      try {
        const tauri = getTauriAPI();
        if (!tauri || !tauri.event) {
          throw new Error('Tauri API not available');
        }

        // Listen for MIDI events
        const unlistenMidi = await tauri.event.listen('midi:event', (e: any) => {
          const payload = e.payload as {
            direction: 'in' | 'out';
            message: number[];
            timestamp: number;
            source?: string;
            target?: string;
            port?: string;
            pressure?: number;
          };
          const message: ServerMessage = {
            type: 'midi',
            direction: payload.direction,
            message: payload.message,
            timestamp: payload.timestamp,
            source: payload.source,
            target: payload.target,
            port: payload.port,
            pressure: payload.pressure,
          };
          listenersRef.current.forEach((fn) => fn(message));
        });

        // Listen for device changes
        const unlistenDevices = await tauri.event.listen('midi:devices', (e: any) => {
          const payload = e.payload as {
            inputs: Array<{ id: string; name: string }>;
            outputs: Array<{ id: string; name: string }>;
          };
          const message: ServerMessage = {
            type: 'devices',
            inputs: payload.inputs,
            outputs: payload.outputs,
          };
          listenersRef.current.forEach((fn) => fn(message));
        });

        // Listen for shell output
        const unlistenShell = await tauri.event.listen('shell:output', (e: any) => {
          const payload = e.payload as {
            cmd: string;
            stream: 'stdout' | 'stderr';
            data: string;
          };
          const message: ServerMessage = {
            type: 'shellOutput',
            cmd: payload.cmd,
            stream: payload.stream,
            data: payload.data,
          };
          listenersRef.current.forEach((fn) => fn(message));
          addToast(
            payload.data,
            payload.stream === 'stderr' ? 'error' : 'success'
          );
        });

        unlistenFnsRef.current = [unlistenMidi, unlistenDevices, unlistenShell];
        console.log('[useTauriMidiConnection] All listeners setup, setting status to connected');
        setStatus('connected');
        
        // Request initial device list
        console.log('[useTauriMidiConnection] Requesting initial device list');
        try {
          const devices = await invoke('list_devices');
          console.log('[useTauriMidiConnection] Received devices:', devices);
          const devicesMsg: ServerMessage = {
            type: 'devices',
            ...devices,
          };
          listenersRef.current.forEach((fn) => fn(devicesMsg));
        } catch (error) {
          console.error('[useTauriMidiConnection] Failed to get initial device list:', error);
        }
      } catch (error) {
        console.error('Failed to setup Tauri listeners:', error);
        setStatus('closed');
        addToast('Failed to connect to Tauri backend', 'error');
      }
    };

    setupListeners();

    return () => {
      unlistenFnsRef.current.forEach((fn) => fn());
      unlistenFnsRef.current = [];
    };
  }, [addToast]);

  // Ping functionality
  useEffect(() => {
    if (!pingEnabled || status !== 'connected') {
      setPingDelay(null);
      return;
    }

    const doPing = async () => {
      try {
        const start = Date.now();
        await invoke('ping', { ts: start });
        const delay = Date.now() - start;
        setPingDelay(delay);
      } catch (error) {
        console.error('Ping failed:', error);
        setPingDelay(null);
      }
    };

    const interval = setInterval(doPing, pingInterval);
    doPing();

    return () => clearInterval(interval);
  }, [pingEnabled, pingInterval, status]);

  const send = useCallback(
    async (msg: ClientMessage) => {
      if (!isTauri()) return false;

      console.log('[useTauriMidiConnection] Sending command:', msg.type, msg);

      try {
        switch (msg.type) {
          case 'listDevices':
          case 'getDevices':
            console.log('[useTauriMidiConnection] Calling list_devices command');
            const devices = await invoke('list_devices');
            console.log('[useTauriMidiConnection] Got devices:', devices);
            const devicesMsg: ServerMessage = {
              type: 'devices',
              ...devices,
            };
            listenersRef.current.forEach((fn) => fn(devicesMsg));
            break;

          case 'send':
          case 'sendMidi':
            await invoke('send_midi', {
              port: (msg as any).port || (msg as any).portId,
              bytes: (msg as any).bytes,
            });
            break;

          case 'setListening':
            await invoke('set_listening', {
              enabled: (msg as SetListeningMessage).enabled,
            });
            break;

          case 'runApp':
            await invoke('run_app', {
              appPath: (msg as any).app || (msg as any).appPath,
            });
            break;

          case 'runShell':
            if ((msg as any).background) {
              await invoke('run_shell_bg', { cmd: (msg as any).cmd });
            } else if ((msg as any).windowed) {
              await invoke('run_shell_win', { cmd: (msg as any).cmd });
            } else {
              await invoke('run_shell', { cmd: (msg as any).cmd });
            }
            break;

          case 'runShellBg':
            await invoke('run_shell_bg', { cmd: (msg as any).cmd });
            break;

          case 'runShellWin':
            await invoke('run_shell_win', { cmd: (msg as any).cmd });
            break;

          case 'keysType':
            await invoke('run_keys', {
              keys: (msg as any).sequence || (msg as any).keys,
              interval: (msg as any).interval,
            });
            break;

          case 'notify':
            await invoke('notify', {
              title: msg.title,
              message: msg.message,
            });
            break;

          case 'ping':
            const pongTs = await invoke<number>('ping', { ts: msg.ts });
            const pongMsg: ServerMessage = {
              type: 'pong',
              ts: pongTs,
            };
            listenersRef.current.forEach((fn) => fn(pongMsg));
            break;

          default:
            console.warn('Unknown message type:', (msg as any).type);
            return false;
        }
        return true;
      } catch (error) {
        console.error('[useTauriMidiConnection] Tauri command failed:', msg.type, error);
        addToast(`Command ${msg.type} failed: ${String(error)}`, 'error');
        return false;
      }
    },
    [addToast]
  );

  const listen = useCallback((fn: RawListener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const reconnect = useCallback(() => {
    // In Tauri, reconnect is not needed as IPC is always available
    if (isTauri()) {
      setStatus('connected');
    }
  }, []);

  // Register send function for legacy code
  useEffect(() => {
    registerSend((data: unknown) => {
      send(data as ClientMessage);
      return true;
    });
  }, [send]);

  return {
    status,
    pingDelay,
    send,
    listen,
    reconnect,
    wsRef: { current: null }, // Compatibility with old interface
  };
}
