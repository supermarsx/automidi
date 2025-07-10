import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';

export interface MidiDevice {
  id: number;
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
  port?: number;
  pressure?: number;
}

export function useMidi() {
  const host = useStore((s) => s.settings.host);
  const port = useStore((s) => s.settings.port);
  const apiKey = useStore((s) => s.settings.apiKey);
  const autoReconnect = useStore((s) => s.settings.autoReconnect);
  const reconnectInterval = useStore((s) => s.settings.reconnectInterval);
  const maxReconnectAttempts = useStore((s) => s.settings.maxReconnectAttempts);
  const pingIntervalSetting = useStore((s) => s.settings.pingInterval);
  const pingEnabled = useStore((s) => s.settings.pingEnabled);
  const selectedOutput = useStore((s) => s.devices.outputId);
  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const [status, setStatus] = useState<'connected' | 'closed' | 'connecting'>(
    'closed',
  );
  const [pingDelay, setPingDelay] = useState<number | null>(null);
  const launchpadRef = useRef<number | null>(null);
  const listeners = useRef(new Set<(msg: MidiMessage) => void>());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingSentAtRef = useRef<number | null>(null);
  const isPageLoadedRef = useRef(false);
  const connectionAttemptsRef = useRef(0);

  // Reset ping delay when disabled
  useEffect(() => {
    if (!pingEnabled) setPingDelay(null);
  }, [pingEnabled]);

  const sendPing = useCallback(() => {
    if (
      pingEnabled &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      pingSentAtRef.current === null
    ) {
      pingSentAtRef.current = Date.now();
      wsRef.current.send(
        JSON.stringify({ type: 'ping', ts: pingSentAtRef.current }),
      );
    }
  }, [pingEnabled]);

  // Wait for page to fully load before connecting
  useEffect(() => {
    const handleLoad = () => {
      isPageLoadedRef.current = true;
      console.log('Page fully loaded, ready to connect WebSocket');
    };

    if (document.readyState === 'complete') {
      isPageLoadedRef.current = true;
      console.log('Page already loaded');
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!isPageLoadedRef.current) {
      console.log('Page not fully loaded yet, waiting...');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log(
      `Attempting WebSocket connection to ws://${host}:${port}?key=${apiKey} (attempt ${connectionAttemptsRef.current + 1})`,
    );
    setStatus('connecting');

    try {
      const ws = new WebSocket(`ws://${host}:${port}?key=${apiKey}`);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('Connection timeout, closing WebSocket');
          ws.close();
        }
      }, 5000); // 5 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully');
        setStatus('connected');
        connectionAttemptsRef.current = 0; // Reset attempts on successful connection

        // Start ping interval if enabled
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (pingEnabled) {
          sendPing();
          pingIntervalRef.current = setInterval(sendPing, pingIntervalSetting);
        }

        // Request device list
        ws.send(JSON.stringify({ type: 'getDevices' }));

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);

          if (payload.type === 'pong' && typeof payload.ts === 'number') {
            if (pingSentAtRef.current !== null) {
              setPingDelay(Date.now() - payload.ts);
              pingSentAtRef.current = null;
            }
            return;
          }

          if (payload.type === 'devices') {
            console.log('Received device list:', payload);
            setInputs(payload.inputs || []);
            setOutputs(payload.outputs || []);

            // Find Launchpad X
            const launchpad = payload.outputs?.find((o: MidiDevice) =>
              o.name?.toLowerCase().includes('launchpad x'),
            );
            launchpadRef.current = launchpad ? launchpad.id : null;
            if (launchpad) {
              console.log('Launchpad X detected:', launchpad);
            }
          } else if (payload.type === 'midi') {
            const msg: MidiMessage = {
              direction: payload.direction || 'in',
              message: payload.message || [],
              timestamp: payload.timestamp || Date.now(),
              source: payload.source,
              target: payload.target,
              port: payload.port,
              pressure: payload.pressure,
            };

            for (const fn of listeners.current) {
              fn(msg);
            }
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket disconnected:', event.code, event.reason);
        setStatus('closed');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        pingSentAtRef.current = null;

        // Auto-reconnect if enabled and not too many attempts
        if (
          autoReconnect &&
          connectionAttemptsRef.current < maxReconnectAttempts &&
          !reconnectTimeoutRef.current
        ) {
          connectionAttemptsRef.current++;
          const delay = Math.min(
            reconnectInterval * connectionAttemptsRef.current,
            30000,
          ); // Max 30s delay
          console.log(
            `Reconnecting in ${delay}ms... (attempt ${connectionAttemptsRef.current}/${maxReconnectAttempts})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, delay);
        } else if (connectionAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
        }
      };

      ws.onerror = (err) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', err);
        setStatus('closed');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        pingSentAtRef.current = null;
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setStatus('closed');
    }
  }, [
    host,
    port,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    pingIntervalSetting,
    pingEnabled,
    sendPing,
  ]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('Manual reconnect triggered');
    connectionAttemptsRef.current = 0; // Reset attempts for manual reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    connectWebSocket();
  }, [connectWebSocket]);

  // Initial connection when page is loaded
  useEffect(() => {
    if (isPageLoadedRef.current) {
      // Small delay to ensure everything is ready
      setTimeout(connectWebSocket, 100);
    }
  }, [connectWebSocket]);

  // Reconnect when settings change
  useEffect(() => {
    if (isPageLoadedRef.current && status !== 'connecting') {
      console.log('Settings changed, reconnecting...');
      connectionAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setTimeout(connectWebSocket, 100);
    }
  }, [host, port]);

  // Update ping interval when setting changes
  useEffect(() => {
    if (status === 'connected' && wsRef.current) {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (pingEnabled) {
        pingIntervalRef.current = setInterval(sendPing, pingIntervalSetting);
      }
    }
  }, [pingIntervalSetting, pingEnabled, status, sendPing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingSentAtRef.current = null;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const send = useCallback(
    (bytes: number[] | Uint8Array) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn(
          'Cannot send MIDI: WebSocket not connected (status:',
          status,
          ')',
        );
        return false;
      }

      // Use selected output device, fallback to Launchpad X, then default to 0
      const targetPort = selectedOutput
        ? Number(selectedOutput)
        : launchpadRef.current !== null
          ? launchpadRef.current
          : 0;

      const bytesArray = Array.from(bytes);

      console.log('Sending MIDI to port', targetPort, ':', bytesArray);

      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'send',
            port: targetPort,
            bytes: bytesArray,
          }),
        );
        return true;
      } catch (err) {
        console.error('Failed to send MIDI:', err);
        return false;
      }
    },
    [selectedOutput, status],
  );

  const listen = useCallback((handler: (msg: MidiMessage) => void) => {
    listeners.current.add(handler);
    return () => {
      listeners.current.delete(handler);
    };
  }, []);

  // Auto-enter programmer mode when Launchpad X is detected
  useEffect(() => {
    if (launchpadRef.current !== null && status === 'connected') {
      console.log('Auto-entering programmer mode for Launchpad X');
      setTimeout(() => {
        send([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x01, 0xf7]);
      }, 1000);
    }
  }, [launchpadRef.current, status, send]);

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
