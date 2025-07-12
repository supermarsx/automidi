import { useCallback, useEffect, useRef, useState } from 'react';

export type MessageListener = (data: unknown) => void;

export interface UseWebSocketOptions {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  connectionTimeout?: number;
  onOpen?: (ws: WebSocket) => void;
}

export function useWebSocket({
  url,
  autoReconnect = true,
  reconnectInterval = 1000,
  maxReconnectAttempts = 5,
  connectionTimeout = 5000,
  onOpen,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<'connected' | 'closed' | 'connecting'>(
    'closed',
  );
  const wsRef = useRef<WebSocket | null>(null);
  const listeners = useRef(new Set<MessageListener>());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const connectionAttemptsRef = useRef(0);
  const isPageLoadedRef = useRef(false);

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
    if (typeof WebSocket === 'undefined') return;
    if (!isPageLoadedRef.current) return;

    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
      if (wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
    }

    setStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      connectionAttemptsRef.current++;

      if (connectionTimeoutRef.current)
        clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }, connectionTimeout);

      ws.onopen = () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setStatus('connected');
        connectionAttemptsRef.current = 0;
        onOpen?.(ws);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      const handleClose = () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setStatus('closed');
        if (
          autoReconnect &&
          connectionAttemptsRef.current < maxReconnectAttempts &&
          !reconnectTimeoutRef.current
        ) {
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
          for (const fn of listeners.current) fn(payload);
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setStatus('closed');
    }
  }, [url, autoReconnect, reconnectInterval, maxReconnectAttempts, onOpen]);

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
      connectionAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setTimeout(connectWebSocket, 100);
    }
  }, [url, connectWebSocket]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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

  const listen = useCallback((fn: MessageListener) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  return { status, send, listen, reconnect, wsRef };
}
