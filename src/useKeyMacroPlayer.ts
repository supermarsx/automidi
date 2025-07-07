import { useCallback } from 'react';
import { useStore } from './store';

export function useKeyMacroPlayer() {
  const macros = useStore((s) => s.macros);

  const playMacro = useCallback(
    async (macroId: string) => {
      const macro = macros.find((m) => m.id === macroId);
      if (!macro) return;
      try {
        await fetch('/keys/type', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sequence: macro.sequence,
            interval: macro.interval,
          }),
        });
      } catch (err) {
        console.error('Failed to play macro', err);
      }
    },
    [macros],
  );

  return { playMacro };
}
