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
  const selectedOutput = useStore((s) => s.devices.outputId);
  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const [status, setStatus] = useState<'connected' | 'closed' | 'connecting'>('connecting');
  const launchpadRef = useRef<number | null>(null);
  const listeners = useRef(new Set<(msg: MidiMessage) => void>());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setStatus('connecting');
    const ws = new WebSocket(`ws://${host}:${port}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setStatus('connected');
      ws.send(JSON.stringify({ type: 'getDevices' }));
    };
    
    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        console.log('WebSocket message received:', payload);
        
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
          
          console.log('MIDI message:', msg);
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
    };
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setStatus('closed');
    };
    
    return () => {
      ws.close();
    };
  }, [host, port]);

  const send = useCallback(
    (bytes: number[] | Uint8Array) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        return;
      }

      const targetPort = selectedOutput ? Number(selectedOutput) : 
                        launchpadRef.current !== null ? launchpadRef.current : 0;
      
      const bytesArray = Array.from(bytes);
      
      console.log('Sending MIDI:', { port: targetPort, bytes: bytesArray });
      
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
      // Enter programmer mode
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
    launchpadDetected: launchpadRef.current !== null
  };
}