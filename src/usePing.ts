import { useCallback, useEffect, useRef, useState } from 'react';

export function usePing(
  wsRef: React.RefObject<WebSocket | null>,
  enabled: boolean,
  interval: number,
) {
  const [pingDelay, setPingDelay] = useState<number | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingSentAtRef = useRef<number | null>(null);

  const sendPing = useCallback(() => {
    if (
      enabled &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      pingSentAtRef.current === null
    ) {
      pingSentAtRef.current = Date.now();
      wsRef.current.send(
        JSON.stringify({ type: 'ping', ts: pingSentAtRef.current }),
      );
    }
  }, [enabled, wsRef]);

  const handlePong = useCallback((ts: number) => {
    if (pingSentAtRef.current !== null) {
      setPingDelay(Date.now() - ts);
      pingSentAtRef.current = null;
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
  }, []);

  useEffect(() => stop, [stop]);

  return { pingDelay, sendPing, handlePong, start, stop };
}
