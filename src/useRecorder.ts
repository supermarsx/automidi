import { useCallback, useEffect, useRef, useState } from 'react';
import { useMidi } from './useMidi';
import type { MidiMsg } from './store';
import { useStore } from './store';

export function useRecorder(isRecording: boolean) {
  const { inputs, listen } = useMidi();
  const inputId = useStore((s) => s.devices.inputId);

  const [messages, setMessages] = useState<MidiMsg[]>([]);
  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      lastTime.current = null;
      return;
    }
    const input = inputs.find(
      (i) => i.id === inputId && i.name?.includes('Launchpad X'),
    );
    if (!input) return;
    const handler = (e: MIDIMessageEvent) => {
      if (!e.data) return;
      const now = performance.now();
      const prev = lastTime.current ?? now;
      lastTime.current = now;
      const delta = now - prev;
      const bytes = Array.from(e.data);
      setMessages((msgs) => [...msgs, { ts: delta, bytes }]);
    };
    const unlisten = listen(handler, input);
    return () => {
      unlisten();
      lastTime.current = null;
    };
  }, [isRecording, inputId, inputs, listen]);

  const clear = useCallback(() => {
    setMessages([]);
    lastTime.current = null;
  }, []);

  return { messages, clear };
}
