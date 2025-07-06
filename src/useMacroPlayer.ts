import { useCallback } from 'react';
import { useMidi } from './useMidi';
import { useStore } from './store';

interface PlayOptions {
  loop?: boolean;
  tempo?: number;
}

export function useMacroPlayer() {
  const { send } = useMidi();
  const macros = useStore((s) => s.macros);

  const playMacro = useCallback(
    (macroId: string, opts: PlayOptions = {}) => {
      const macro = macros.find((m) => m.id === macroId);
      if (!macro) return;

      const tempo = opts.tempo ?? 120;
      const scale = 120 / tempo;

      const schedule = () => {
        let delay = 0;
        for (const msg of macro.messages) {
          delay += msg.ts * scale;
          setTimeout(() => {
            queueMicrotask(() => send(msg.bytes));
          }, delay);
        }
        if (opts.loop) setTimeout(schedule, delay);
      };

      queueMicrotask(schedule);
    },
    [macros, send],
  );

  return { playMacro };
}
