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
}

export function useMidi() {
  const host = useStore((s) => s.settings.host);
  const port = useStore((s) => s.settings.port);
  const autoReconnect = useStore((s) => s.settings.autoReconnect);
  const reconnectInterval = useStore((s) => s.settings.reconnectInterval);
  const maxReconnectAttempts = useStore((s) => s.settings.maxReconnectAttempts);
  const selectedOutput = useStore((s) => s.devices.outputId);
  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const [status, setStatus] = useState<'connected' | 'closed' | 'connecting'>('closed');
  const [pingDelay, setPingDelay] = useState<number | null>(null);
  const launchpadRef = useRef<number | null>(null);
  const listeners = useRef(new Set<(msg: MidiMessage) => void>());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageLoadedRef = useRef(false);
  const connectionAttemptsRef = useRef(0);
  const lastPingRef = useRef<number | null>(null);

  // Wait for page to fully load before connecting
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    console.log(`Attempting WebSocket connection to ws://${host}:${port} (attempt ${connectionAttemptsRef.current + 1})`);
    setStatus('connecting');
    
    try {
      const ws = new WebSocket(`ws://${host}:${port}`);
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

        // Start ping interval
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            lastPingRef.current = Date.now();
            wsRef.current.send(JSON.stringify({ type: 'ping', ts: lastPingRef.current }));
          }
        }, 10000);

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
          
          if (payload.type === 'devices') {
            console.log('Received device list:', payload);
            setInputs(payload.inputs || []);
            setOutputs(payload.outputs || []);
            
            // Find Launchpad X
            const launchpad = payload.outputs?.find((o: MidiDevice) =>
              o.name?.toLowerCase().includes('launchpad x')
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
              port: payload.port
            };

            for (const fn of listeners.current) {
              fn(msg);
            }
          } else if (payload.type === 'pong') {
            const sent = payload.ts || lastPingRef.current;
            if (sent) {
              setPingDelay(Date.now() - sent);
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

        // Auto-reconnect if enabled and not too many attempts
        if (autoReconnect && connectionAttemptsRef.current < maxReconnectAttempts && !reconnectTimeoutRef.current) {
          connectionAttemptsRef.current++;
          const delay = Math.min(reconnectInterval * connectionAttemptsRef.current, 30000); // Max 30s delay
          console.log(`Reconnecting in ${delay}ms... (attempt ${connectionAttemptsRef.current}/${maxReconnectAttempts})`);
          
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
      };
      
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setStatus('closed');
    }
  }, [host, port, autoReconnect, reconnectInterval, maxReconnectAttempts]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const send = useCallback(
    (bytes: number[] | Uint8Array) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('Cannot send MIDI: WebSocket not connected (status:', status, ')');
        return false;
      }

      // Use selected output device, fallback to Launchpad X, then default to 0
      const targetPort = selectedOutput ? Number(selectedOutput) : 
                        launchpadRef.current !== null ? launchpadRef.current : 0;
      
      const bytesArray = Array.from(bytes);
      
      console.log('Sending MIDI to port', targetPort, ':', bytesArray);
      
      try {
        wsRef.current.send(JSON.stringify({ 
          type: 'send', 
          port: targetPort, 
          bytes: bytesArray 
        }));
        return true;
      } catch (err) {
        console.error('Failed to send MIDI:', err);
        return false;
      }
    },
    [selectedOutput, status]
  );

  const listen = useCallback((handler: (msg: MidiMessage) => void) => {
    listeners.current.add(handler);
    return () => {
      listeners.current.delete(handler);
    };
  }, []);

  // Auto-enter programmer mode when Launchpad X is detected
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    reconnect
  };
}