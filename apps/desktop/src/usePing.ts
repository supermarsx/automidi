import { useCallback, useEffect, useRef, useState } from 'react';

export function usePing(
  _wsRef: React.RefObject<WebSocket | null>,
  enabled: boolean,
  interval: number,
  reconnectOnLost = false,
) {
  const [pingDelay, setPingDelay] = useState<number | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingSentAtRef = useRef<number | null>(null);
  const missedPongsRef = useRef(0);

  const handlePong = useCallback((ts: number) => {
    if (pingSentAtRef.current !== null) {
      setPingDelay(Date.now() - ts);
      pingSentAtRef.current = null;
      missedPongsRef.current = 0;
    }
  }, []);

  const sendPing = useCallback(async () => {
    if (!enabled) return;
    if (typeof window === 'undefined' || !('__TAURI__' in window)) return;

    if (pingSentAtRef.current !== null) {
      missedPongsRef.current += 1;
      if (reconnectOnLost && missedPongsRef.current >= 3) {
        pingSentAtRef.current = null;
        missedPongsRef.current = 0;
        return;
      }
    }

    pingSentAtRef.current = Date.now();
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const pongTs = await invoke<number>('ping', {
        ts: pingSentAtRef.current,
      });
      handlePong(pongTs);
    } catch (err) {
      console.error('Failed to send ping', err);
    }
  }, [enabled, handlePong, reconnectOnLost]);

  const start = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (enabled) {
      sendPing();
      pingIntervalRef.current = setInterval(sendPing, interval);
    }
  }, [enabled, interval, sendPing]);

  const stop = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    pingSentAtRef.current = null;
    missedPongsRef.current = 0;
  }, []);

  useEffect(() => stop, [stop]);

  return { pingDelay, sendPing, handlePong, start, stop };
}
