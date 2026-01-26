import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { useMidiConnection, type RawMessage } from './useMidiConnection';
import type { MidiDevice } from '../shared/messages';
import { isDevicesMessage, isMidiPayload } from './types';
import { useToastStore } from './toastStore';
import { useLogStore } from './logStore';

export interface MidiMessage {
  direction: 'in' | 'out';
  message: number[];
  timestamp: number;
  source?: string;
  target?: string;
  port?: string;
  pressure?: number;
}

export function useMidi() {
  const selectedOutput = useStore((s) => s.devices.outputId);
  const setOutputId = useStore((s) => s.setOutputId);
  const selectedInput = useStore((s) => s.devices.inputId);
  const setInputId = useStore((s) => s.setInputId);
  const addToast = useToastStore((s) => s.addToast);
  const addMessage = useLogStore((s) => s.addMessage);
  const {
    status,
    pingDelay,
    send: sendRaw,
    listen: listenRaw,
    reconnect,
  } = useMidiConnection();

  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const launchpadRef = useRef<string | null>(null);
  const listeners = useRef(new Set<(msg: MidiMessage) => void>());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevInputsRef = useRef<MidiDevice[]>([]);
  const prevOutputsRef = useRef<MidiDevice[]>([]);
  const lastSelectedInputRef = useRef<string | null>(null);
  const lastSelectedOutputRef = useRef<string | null>(null);

  const send = useCallback(
    async (bytes: number[] | Uint8Array) => {
      const targetPort = selectedOutput || launchpadRef.current;
      if (!targetPort) {
        console.warn('[useMidi] No target port available');
        return false;
      }
      const bytesArray = Array.from(bytes);
      console.log('[useMidi] Sending MIDI:', { port: targetPort, bytes: bytesArray });
      
      // Log outgoing MIDI message
      addMessage({
        direction: 'out',
        message: bytesArray,
        timestamp: Date.now(),
        target: outputs.find(o => o.id === targetPort)?.name || targetPort,
      });
      
      const result = await sendRaw({ type: 'send', port: targetPort, bytes: bytesArray });
      console.log('[useMidi] Send result:', result);
      return result;
    },
    [selectedOutput, sendRaw, addMessage, outputs],
  );

  const sendRef = useRef(send);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const listen = useCallback((handler: (msg: MidiMessage) => void) => {
    listeners.current.add(handler);
    return () => {
      listeners.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    const unsub = listenRaw((payload: RawMessage) => {
      if (isDevicesMessage(payload)) {
        const newInputs = payload.inputs || [];
        const newOutputs = payload.outputs || [];
        
        // Check for disconnected devices
        const prevInputIds = new Set(prevInputsRef.current.map(d => d.id));
        const newInputIds = new Set(newInputs.map(d => d.id));
        const prevOutputIds = new Set(prevOutputsRef.current.map(d => d.id));
        const newOutputIds = new Set(newOutputs.map(d => d.id));
        
        // Detect disconnections
        prevInputsRef.current.forEach(device => {
          if (!newInputIds.has(device.id)) {
            addToast(`Input device disconnected: ${device.name || device.id}`, 'error');
            if (selectedInput === device.id) {
              lastSelectedInputRef.current = device.id;
            }
          }
        });
        
        prevOutputsRef.current.forEach(device => {
          if (!newOutputIds.has(device.id)) {
            addToast(`Output device disconnected: ${device.name || device.id}`, 'error');
            if (selectedOutput === device.id) {
              lastSelectedOutputRef.current = device.id;
            }
          }
        });
        
        // Detect reconnections and new connections
        newInputs.forEach(device => {
          if (!prevInputIds.has(device.id)) {
            if (prevInputsRef.current.length > 0) {
              addToast(`Input device reconnected: ${device.name || device.id}`, 'success');
            } else {
              // Initial connection
              addToast(`Input device connected: ${device.name || device.id}`, 'success');
            }
            // Auto-reconnect if it was the last selected device
            if (lastSelectedInputRef.current === device.id || (!selectedInput && device.name?.toLowerCase().includes('launchpad'))) {
              setInputId(device.id);
              lastSelectedInputRef.current = null;
            }
          }
        });
        
        newOutputs.forEach(device => {
          if (!prevOutputIds.has(device.id)) {
            if (prevOutputsRef.current.length > 0) {
              addToast(`Output device reconnected: ${device.name || device.id}`, 'success');
            } else {
              // Initial connection
              addToast(`Output device connected: ${device.name || device.id}`, 'success');
            }
            // Auto-reconnect if it was the last selected device
            if (lastSelectedOutputRef.current === device.id || (!selectedOutput && device.name?.toLowerCase().includes('launchpad'))) {
              setOutputId(device.id);
              lastSelectedOutputRef.current = null;
            }
          }
        });
        
        setInputs(newInputs);
        setOutputs(newOutputs);
        prevInputsRef.current = newInputs;
        prevOutputsRef.current = newOutputs;
        
        const launchpad = newOutputs?.find((o: MidiDevice) =>
          o.name?.toLowerCase().includes('launchpad x'),
        );
        launchpadRef.current = launchpad ? launchpad.id : null;
      } else if (isMidiPayload(payload)) {
        const msg: MidiMessage = {
          direction: payload.direction,
          message: payload.message,
          timestamp: payload.timestamp,
          source: payload.source,
          target: payload.target,
          port: payload.port,
          pressure: payload.pressure,
        };
        
        // Log incoming MIDI message
        addMessage(msg);
        
        for (const fn of listeners.current) fn(msg);
      }
    });
    return unsub;
  }, [listenRaw, selectedInput, selectedOutput, setInputId, setOutputId, addToast, addMessage]);

  // Request device list on mount and when connected
  useEffect(() => {
    if (status === 'connected') {
      sendRaw({ type: 'listDevices' });
      // Also enable MIDI listening
      sendRaw({ type: 'setListening', enabled: true });
    }
  }, [status, sendRaw]);

  useEffect(() => {
    if (launchpadRef.current !== null && status === 'connected') {
      const timeoutId = setTimeout(() => {
        sendRef.current([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x01, 0xf7]);
      }, 1000);
      timeoutRef.current = timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutRef.current = null;
      };
    }
  }, [status]);

  return {
    inputs,
    outputs,
    send,
    listen,
    status,
    pingDelay,
    launchpadDetected: launchpadRef.current !== null,
    reconnect,
  };
}
