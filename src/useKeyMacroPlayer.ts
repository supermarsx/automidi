import { useCallback } from 'react';
import { useStore } from './store';
import { useToastStore } from './toastStore';
import { MACRO_MESSAGES } from './macroMessages';
import { sendSocketMessage } from './socket';
import { isTauri, invoke } from './tauriApi';

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
      if (process.env.NODE_ENV !== 'production') {
        console.log('Playing macro', macro);
      }
      addToast(`Playing: ${macro.name}`, 'success');
      try {
        if (macro.type === 'midi') {
          const port = useStore.getState().devices.outputId;
          if (port && macro.midiData) {
            if (isTauri()) {
              for (const bytes of macro.midiData) {
                await invoke('sendMidi', { port, bytes });
              }
            } else {
              for (const bytes of macro.midiData) {
                sendSocketMessage({ type: 'send', port, bytes });
              }
            }
          }
        } else {
          // Handle shell/app/keys macros
          if (isTauri()) {
            if (macro.type === 'shell' || macro.type === 'shell_win' || macro.type === 'shell_bg') {
              const cmdType = macro.type === 'shell' ? 'runShell' : 
                             macro.type === 'shell_win' ? 'runShellWin' : 'runShellBg';
              await invoke(cmdType, { cmd: macro.command || '' });
            } else if (macro.type === 'app') {
              await invoke('runApp', { cmd: macro.command || '' });
            } else if (macro.type === 'keys' && macro.sequence) {
              await invoke('runKeys', { 
                keys: macro.sequence, 
                interval: macro.interval || 50 
              });
            }
          } else {
            const { type, payload } = MACRO_MESSAGES[macro.type || 'keys'];
            sendSocketMessage({ type, ...payload(macro) });
          }
        }
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
