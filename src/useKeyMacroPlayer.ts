import { useCallback } from 'react';
import { useStore } from './store';

export function useKeyMacroPlayer() {
  const macros = useStore((s) => s.macros);

  const playMacro = useCallback(
    async (macroId: string) => {
      const macro = macros.find((m) => m.id === macroId);
      if (!macro) return;
      try {
        if (macro.type === 'app') {
          await fetch('/run/app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app: macro.command }),
          });
        } else if (macro.type === 'shell') {
          await fetch('/run/shell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd: macro.command }),
          });
        } else {
          await fetch('/keys/type', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sequence: macro.sequence,
              interval: macro.interval,
            }),
          });
        }
        if (macro.nextId) {
          await playMacro(macro.nextId);
        }
      } catch (err) {
        console.error('Failed to play macro', err);
      }
    },
    [macros],
  );

  return { playMacro };
}
