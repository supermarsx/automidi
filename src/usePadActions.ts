import { useEffect, useRef } from 'react';
import { useMidi, type MidiMessage } from './useMidi';
import { useStore } from './store';
import { useKeyMacroPlayer } from './useKeyMacroPlayer';
import { notify } from './notify';

export function usePadActions() {
  const padActions = useStore((s) => s.padActions);
  const padChannels = useStore((s) => s.padChannels);
  const setPadChannel = useStore((s) => s.setPadChannel);
  const { listen } = useMidi();
  const { playMacro } = useKeyMacroPlayer();
  const confirmRef = useRef<
    Record<string, { t: ReturnType<typeof setTimeout>; prev: number }>
  >({});

  const handleMacro = (macroId: string, id: string, confirm?: boolean) => {
    if (!confirm) {
      playMacro(macroId);
      return;
    }
    const entry = confirmRef.current[id];
    if (!entry) {
      const prev = padChannels[id] || 1;
      setPadChannel(id, 3);
      notify('Press pad again to confirm');
      const t = setTimeout(() => {
        setPadChannel(id, prev);
        delete confirmRef.current[id];
      }, 2000);
      confirmRef.current[id] = { t, prev };
    } else {
      clearTimeout(entry.t);
      setPadChannel(id, entry.prev);
      delete confirmRef.current[id];
      playMacro(macroId);
    }
  };

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
        handleMacro(action.noteOn, padId, action.confirm);
      } else if (!isOn && action.noteOff) {
        handleMacro(action.noteOff, padId, action.confirm);
      }
    };

    const unlisten = listen(handler);
    return () => unlisten();
  }, [listen, padActions, handleMacro]);
}
