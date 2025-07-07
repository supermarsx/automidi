import { useEffect, useRef } from 'react';
import { useMidi, type MidiMessage } from './useMidi';
import { useStore } from './store';
import { useKeyMacroPlayer } from './useKeyMacroPlayer';
import { notify } from './notify';
import { useToastStore } from './toastStore';
import LAUNCHPAD_COLORS from './launchpadColors';
import { noteOn, cc, lightingSysEx } from './midiMessages';

export function usePadActions() {
  const padActions = useStore((s) => s.padActions);
  const padChannels = useStore((s) => s.padChannels);
  const padColours = useStore((s) => s.padColours);
  const sysexColorMode = useStore((s) => s.settings.sysexColorMode);
  const setPadChannel = useStore((s) => s.setPadChannel);
  const { listen, send } = useMidi();
  const { playMacro } = useKeyMacroPlayer();
  const confirmRef = useRef<
    Record<string, { t: ReturnType<typeof setTimeout>; prev: number }>
  >({});

  const sendPadState = (id: string, channel: number) => {
    const colours = padColours[id] || {};
    const colorHex = colours[channel] || colours[1] || '#000000';
    const colorVal =
      LAUNCHPAD_COLORS.find((c) => c.color === colorHex)?.value || 0;
    const padId = id.startsWith('n-')
      ? Number(id.slice(2))
      : id.startsWith('cc-')
        ? Number(id.slice(3))
        : NaN;
    if (Number.isNaN(padId)) return;
    if (sysexColorMode) {
      const type = channel === 1 ? 0 : channel === 2 ? 1 : 2;
      const data = channel === 2 ? [0, colorVal] : [colorVal];
      send(lightingSysEx([{ type, index: padId, data }]));
    } else if (id.startsWith('n-')) {
      send(noteOn(padId, colorVal, channel));
    } else {
      send(cc(padId, colorVal, channel));
    }
  };

  const handleMacro = (
    macroId: string,
    id: string,
    confirm?: boolean,
    toastConfirm?: boolean,
  ) => {
    console.log('Pad macro trigger', { macroId, id, confirm, toastConfirm });
    if (!confirm) {
      playMacro(macroId);
      return;
    }
    const entry = confirmRef.current[id];
    if (!entry) {
      const prev = padChannels[id] || 1;
      setPadChannel(id, 3);
      sendPadState(id, 3);
      if (toastConfirm) {
        useToastStore
          .getState()
          .addToast('Press pad again to confirm', 'success');
      } else {
        notify('Press pad again to confirm');
      }
      const t = setTimeout(() => {
        setPadChannel(id, prev);
        sendPadState(id, prev);
        delete confirmRef.current[id];
      }, 2000);
      confirmRef.current[id] = { t, prev };
    } else {
      clearTimeout(entry.t);
      setPadChannel(id, entry.prev);
      sendPadState(id, entry.prev);
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
        handleMacro(action.noteOn, padId, action.confirm, action.confirmToast);
      } else if (!isOn && action.noteOff) {
        handleMacro(action.noteOff, padId, action.confirm, action.confirmToast);
      }
    };

    const unlisten = listen(handler);
    return () => unlisten();
  }, [listen, padActions, handleMacro]);
}
