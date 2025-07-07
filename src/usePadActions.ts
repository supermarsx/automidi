import { useEffect } from 'react';
import { useMidi, type MidiMessage } from './useMidi';
import { useStore } from './store';
import { useMacroPlayer } from './useMacroPlayer';

export function usePadActions() {
  const padActions = useStore((s) => s.padActions);
  const { listen } = useMidi();
  const { playMacro } = useMacroPlayer();

  useEffect(() => {
    const handler = (msg: MidiMessage) => {
      const bytes = msg.message;
      if (!bytes || bytes.length < 2) return;
      const status = bytes[0] & 0xf0;
      let padId: string | null = null;
      let isOn = false;

      if (status === 0x90) {
        padId = `n-${bytes[1]}`;
        isOn = bytes[2] !== 0;
      } else if (status === 0x80) {
        padId = `n-${bytes[1]}`;
        isOn = false;
      } else if (status === 0xb0) {
        padId = `cc-${bytes[1]}`;
        isOn = bytes[2] !== 0;
      } else {
        return;
      }

      const action = padActions[padId];
      if (!action) return;
      if (isOn && action.noteOn) {
        playMacro(action.noteOn);
      } else if (!isOn && action.noteOff) {
        playMacro(action.noteOff);
      }
    };

    const unlisten = listen(handler);
    return () => unlisten();
  }, [listen, playMacro, padActions]);
}
