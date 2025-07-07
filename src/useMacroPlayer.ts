import { useCallback } from 'react';
import { useStore } from './store';

interface PlayOptions {
  loop?: boolean;
  timeBetween?: number;
}

export function useMacroPlayer() {
  const macros = useStore((s) => s.macros);

  const playMacro = useCallback(
    (macroId: string, opts: PlayOptions = {}) => {
      const macro = macros.find((m) => m.id === macroId);
      if (!macro) return;

      const step = opts.timeBetween ?? macro.timeBetween;

      const run = () => {
        let delay = 0;
        for (const key of macro.keys) {
          delay += step;
          setTimeout(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key }));
            document.dispatchEvent(new KeyboardEvent('keyup', { key }));
          }, delay);
        }
        if (opts.loop) setTimeout(run, delay + step);
      };

      queueMicrotask(run);
    },
    [macros],
  );

  return { playMacro };
}
