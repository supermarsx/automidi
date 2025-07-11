import { useCallback } from 'react';
import { useStore } from './store';
import { useToastStore } from './toastStore';
import { MACRO_MESSAGES } from './macroMessages';
import { sendSocketMessage } from './socket';

export function useKeyMacroPlayer() {
  const macros = useStore((s) => s.macros);
  const addToast = useToastStore.getState().addToast;

  const playMacro = useCallback(
    async function playMacro(
      macroId: string,
      visited: Set<string> = new Set(),
    ) {
      if (visited.has(macroId)) {
        const msg = `Macro cycle detected at ${macroId}`;
        console.error(msg);
        addToast(msg, 'error');
        return;
      }

      visited.add(macroId);
      const macro = macros.find((m) => m.id === macroId);
      if (!macro) return;
      console.log('Playing macro', macro);
      addToast(`Playing: ${macro.name}`, 'success');
      try {
        const { type, payload } = MACRO_MESSAGES[macro.type || 'keys'];
        sendSocketMessage({ type, ...payload(macro) });
        if (macro.nextId) {
          await playMacro(macro.nextId, visited);
        }
      } catch (err) {
        console.error('Failed to play macro', err);
      }
    },
    [macros, addToast],
  );

  return { playMacro };
}
