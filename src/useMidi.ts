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
  const selectedOutput = useStore((s) => s.devices.outputId);
  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const [status, setStatus] = useState<'connected' | 'closed' | 'connecting'>('connecting');
  const launchpadRef = useRef<number | null>(null);
  const listeners = useRef(new Set<(msg: MidiMessage) => void>());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPageLoadedRef = useRef(false);

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
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    console.log(`Connecting to WebSocket at ws://${host}:${port}`);
    setStatus('connecting');
    
    const ws = new WebSocket(`ws://${host}:${port}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setStatus('connected');
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
          setInputs(payload.inputs || []);
          setOutputs(payload.outputs || []);
          
          // Find Launchpad X
          const launchpad = payload.outputs?.find((o: MidiDevice) =>
            o.name?.toLowerCase().includes('launchpad x')
          );
          launchpadRef.current = launchpad ? launchpad.id : null;
          console.log('Launchpad X detected:', launchpad);
          
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
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setStatus('closed');
      
      // Auto-reconnect if enabled
      if (autoReconnect && !reconnectTimeoutRef.current) {
        console.log(`Reconnecting in ${reconnectInterval}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connectWebSocket();
        }, reconnectInterval);
      }
    };
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setStatus('closed');
    };
  }, [host, port, autoReconnect, reconnectInterval]);

  // Initial connection when page is loaded
  useEffect(() => {
    if (isPageLoadedRef.current) {
      connectWebSocket();
    }
  }, [connectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const send = useCallback(
    (bytes: number[] | Uint8Array) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        return;
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
      } catch (err) {
        console.error('Failed to send MIDI:', err);
      }
    },
    [selectedOutput]
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
    launchpadDetected: launchpadRef.current !== null,
    reconnect: connectWebSocket
  };
}