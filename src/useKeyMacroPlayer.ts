import { useCallback } from 'react';
import { useStore } from './store';
import { useToastStore } from './toastStore';

export function useKeyMacroPlayer() {
  const macros = useStore((s) => s.macros);
  const addToast = useToastStore.getState().addToast;

  const playMacro = useCallback(
    async (macroId: string) => {
      const macro = macros.find((m) => m.id === macroId);
      if (!macro) return;
      console.log('Playing macro', macro);
      addToast(`Playing: ${macro.name}`, 'success');
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
        } else if (macro.type === 'shell_win') {
          await fetch('/run/shellWin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd: macro.command }),
          });
        } else if (macro.type === 'shell_bg') {
          await fetch('/run/shellBg', {
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
