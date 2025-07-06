import { useCallback, useEffect, useRef, useState } from 'react';
import { useMidi, type MidiMessage } from './useMidi';
import type { MidiMsg } from './store';

export function useRecorder(isRecording: boolean) {
  const { listen } = useMidi();

  const [messages, setMessages] = useState<MidiMsg[]>([]);
  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      lastTime.current = null;
      return;
    }
    const handler = (msg: MidiMessage) => {
      const { data } = msg;
      const now = performance.now();
      const prev = lastTime.current ?? now;
      lastTime.current = now;
      const delta = now - prev;
      const bytes = Array.from(data);
      setMessages((msgs) => [...msgs, { ts: delta, bytes }]);
    };
    const unlisten = listen(handler);
    return () => {
      unlisten();
      lastTime.current = null;
    };
  }, [isRecording, listen]);

  const clear = useCallback(() => {
    setMessages([]);
    lastTime.current = null;
  }, []);

  return { messages, clear };
}
