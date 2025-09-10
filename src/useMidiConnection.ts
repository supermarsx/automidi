import { useCallback, useEffect } from 'react';
import { useStore } from './store';
import { usePing } from './usePing';
import { registerSend } from './socket';
import { useWebSocket } from './useWebSocket';
import type { ClientMessage, ServerMessage } from '../shared/messages';
import { useToastStore } from './toastStore';

export type RawMessage = ServerMessage;
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
  const reconnectOnLost = useStore((s) => s.settings.reconnectOnLost);
  const addToast = useToastStore((s) => s.addToast);

  const url = `ws://${host}:${port}?key=${encodeURIComponent(apiKey)}`;

  const {
    status,
    send: wsSend,
    listen: wsListen,
    reconnect,
    wsRef,
  } = useWebSocket({
    url,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    connectionTimeout: 5000,
  });

  const {
    pingDelay,
    handlePong,
    start: startPing,
    stop: stopPing,
  } = usePing(wsRef, pingEnabled, pingInterval, reconnectOnLost);

  const send = useCallback((msg: ClientMessage) => wsSend(msg), [wsSend]);

  const listen = useCallback(
    (fn: RawListener) => wsListen((data) => fn(data as ServerMessage)),
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
    registerSend((data: unknown) => send(data as ClientMessage));
  }, [send]);

  return { status, pingDelay, send, listen, reconnect, wsRef };
}
