import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { usePing } from './usePing';
import { registerSend } from './socket';

export type RawMessage = Record<string, unknown>;
export type RawListener = (msg: RawMessage) => void;

export function useMidiConnection() {
  const host = useStore((s) => s.settings.host);
  const port = useStore((s) => s.settings.port);
  const apiKey = useStore((s) => s.settings.apiKey);
  const autoReconnect = useStore((s) => s.settings.autoReconnect);
  const reconnectInterval = useStore((s) => s.settings.reconnectInterval);
  const maxReconnectAttempts = useStore((s) => s.settings.maxReconnectAttempts);
  const pingInterval = useStore((s) => s.settings.pingInterval);
  const pingEnabled = useStore((s) => s.settings.pingEnabled);

  const [status, setStatus] = useState<'connected' | 'closed' | 'connecting'>(
    'closed',
  );
  const wsRef = useRef<WebSocket | null>(null);
  const listeners = useRef(new Set<RawListener>());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const connectionAttemptsRef = useRef(0);
  const isPageLoadedRef = useRef(false);

  const {
    pingDelay,
    handlePong,
    start: startPing,
    stop: stopPing,
  } = usePing(wsRef, pingEnabled, pingInterval);

  // Reset ping delay when disabled
  useEffect(() => {
    if (!pingEnabled) stopPing();
  }, [pingEnabled, stopPing]);

  // Wait for page to fully load before connecting
  useEffect(() => {
    const handleLoad = () => {
      isPageLoadedRef.current = true;
    };

    if (document.readyState === 'complete') {
      isPageLoadedRef.current = true;
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!isPageLoadedRef.current) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus('connecting');

    try {
      const ws = new WebSocket(`ws://${host}:${port}?key=${apiKey}`);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        setStatus('connected');
        connectionAttemptsRef.current = 0;
        startPing();
        ws.send(JSON.stringify({ type: 'getDevices' }));
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      const handleClose = () => {
        clearTimeout(connectionTimeout);
        setStatus('closed');
        stopPing();
        if (
          autoReconnect &&
          connectionAttemptsRef.current < maxReconnectAttempts &&
          !reconnectTimeoutRef.current
        ) {
          connectionAttemptsRef.current++;
          const delay = Math.min(
            reconnectInterval * connectionAttemptsRef.current,
            30000,
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, delay);
        }
      };

      ws.onclose = handleClose;
      ws.onerror = handleClose;

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.type === 'pong' && typeof payload.ts === 'number') {
            handlePong(payload.ts);
            return;
          }
          for (const fn of listeners.current) fn(payload);
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setStatus('closed');
    }
  }, [
    host,
    port,
    apiKey,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    startPing,
    stopPing,
    handlePong,
  ]);

  const reconnect = useCallback(() => {
    connectionAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    connectWebSocket();
  }, [connectWebSocket]);

  useEffect(() => {
    if (isPageLoadedRef.current) {
      setTimeout(connectWebSocket, 100);
    }
  }, [connectWebSocket]);

  useEffect(() => {
    if (isPageLoadedRef.current && status !== 'connecting') {
      connectionAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setTimeout(connectWebSocket, 100);
    }
  }, [host, port, connectWebSocket, status]);

  useEffect(() => {
    if (status === 'connected') startPing();
  }, [pingInterval, pingEnabled, status, startPing]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopPing();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [stopPing]);

  const send = useCallback((data: unknown) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return false;
    try {
      wsRef.current.send(JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Failed to send', err);
      return false;
    }
  }, []);

  const listen = useCallback((fn: RawListener) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  useEffect(() => {
    registerSend(send);
  }, [send]);

  return { status, pingDelay, send, listen, reconnect, wsRef };
}
