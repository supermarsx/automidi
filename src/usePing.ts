import { useCallback, useEffect, useRef, useState } from 'react';

export function usePing(
  wsRef: React.RefObject<WebSocket | null>,
  enabled: boolean,
  interval: number,
  reconnectOnLost = false,
) {
  const [pingDelay, setPingDelay] = useState<number | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingSentAtRef = useRef<number | null>(null);
  const missedPongsRef = useRef(0);

  const sendPing = useCallback(() => {
    const ws = wsRef.current;
    if (!enabled || !ws || ws.readyState !== WebSocket.OPEN) return;

    if (pingSentAtRef.current !== null) {
      missedPongsRef.current += 1;
      if (reconnectOnLost && missedPongsRef.current >= 3) {
        ws.close();
        missedPongsRef.current = 0;
        pingSentAtRef.current = null;
        return;
      }
    }

    pingSentAtRef.current = Date.now();
    ws.send(JSON.stringify({ type: 'ping', ts: pingSentAtRef.current }));
  }, [enabled, wsRef, reconnectOnLost]);

  const handlePong = useCallback((ts: number) => {
    if (pingSentAtRef.current !== null) {
      setPingDelay(Date.now() - ts);
      pingSentAtRef.current = null;
      missedPongsRef.current = 0;
    }
  }, []);

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
