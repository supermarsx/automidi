import { useCallback, useEffect } from 'react';
import { useStore } from './store';
import { usePing } from './usePing';
import { registerSend } from './socket';
import { useWebSocket } from './useWebSocket';

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

  const url = `ws://${host}:${port}?key=${apiKey}`;

  const {
    status,
    send,
    listen: wsListen,
    reconnect,
    wsRef,
  } = useWebSocket({
    url,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    onOpen: (ws) => {
      ws.send(JSON.stringify({ type: 'getDevices' }));
    },
  });

  const {
    pingDelay,
    handlePong,
    start: startPing,
    stop: stopPing,
  } = usePing(wsRef, pingEnabled, pingInterval);

  const listen = useCallback(
    (fn: RawListener) => wsListen((data) => fn(data as RawMessage)),
    [wsListen],
  );

  useEffect(() => {
    if (!pingEnabled) stopPing();
  }, [pingEnabled, stopPing]);

  useEffect(() => {
    if (status === 'connected') startPing();
    else stopPing();
  }, [status, startPing, stopPing]);

  useEffect(() => {
    const unsub = listen((payload: RawMessage) => {
      if (
        payload.type === 'pong' &&
        typeof (payload as { ts?: unknown }).ts === 'number'
      ) {
        handlePong((payload as { ts: number }).ts);
      }
    });
    return unsub;
  }, [listen, handlePong]);

  useEffect(() => stopPing, [stopPing]);

  useEffect(() => {
    registerSend(send);
  }, [send]);

  return { status, pingDelay, send, listen, reconnect, wsRef };
}
