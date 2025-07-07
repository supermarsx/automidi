import { useEffect, useState, useCallback } from 'react';

export function useKeyRecorder(isRecording: boolean) {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!isRecording) return;
    const handler = (e: KeyboardEvent) => {
      setKeys((ks) => [...ks, e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isRecording]);

  const clear = useCallback(() => setKeys([]), []);

  return { keys, clear };
}
