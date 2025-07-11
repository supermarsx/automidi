import { useCallback } from 'react';
import { useStore } from './store';
import { useToastStore } from './toastStore';
import { MACRO_ENDPOINTS } from './macroEndpoints';

export function useKeyMacroPlayer() {
  const macros = useStore((s) => s.macros);
  const addToast = useToastStore.getState().addToast;
  const apiKey = useStore.getState().settings.apiKey;

  const playMacro = useCallback(
    async (macroId: string) => {
      const macro = macros.find((m) => m.id === macroId);
      if (!macro) return;
      console.log('Playing macro', macro);
      addToast(`Playing: ${macro.name}`, 'success');
      try {
        const { url, body } = MACRO_ENDPOINTS[macro.type || 'keys'];
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify(body(macro)),
        });
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
