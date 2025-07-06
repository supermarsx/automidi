import { useCallback, useEffect, useRef, useState } from 'react';

export function useMidi() {
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [outputs, setOutputs] = useState<MIDIOutput[]>([]);
  const launchpad = useRef<MIDIOutput | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    navigator.requestMIDIAccess({ sysex: true }).then((access) => {
      const update = () => {
        const inList = Array.from(access.inputs.values());
        const outList = Array.from(access.outputs.values());
        setInputs(inList);
        setOutputs(outList);
        const hasLaunchpad =
          inList.some((i) => i.name?.includes('Launchpad X')) &&
          outList.some((o) => o.name?.includes('Launchpad X'));
        if (hasLaunchpad && !readyRef.current) {
          readyRef.current = true;
          window.dispatchEvent(new Event('midi-ready'));
        }
      };
      access.onstatechange = update;
      update();
    });
  }, []);

  const send = useCallback(
    (bytes: number[] | Uint8Array, output?: MIDIOutput | null) => {
      const out = output ?? launchpad.current;
      out?.send(bytes);
    },
    [],
  );

  const listen = useCallback(
    (handler: (e: MIDIMessageEvent) => void, input?: MIDIInput) => {
      const inp = input ?? inputs.find((i) => i.name?.includes('Launchpad X'));
      inp?.addEventListener('midimessage', handler);
      return () => inp?.removeEventListener('midimessage', handler);
    },
    [inputs],
  );

  const enterProgrammer = useCallback(() => {
    send([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x01, 0xf7]);
  }, [send]);

  const returnToLive = useCallback(() => {
    send([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x00, 0xf7]);
  }, [send]);

  useEffect(() => {
    const handler = () => {
      launchpad.current =
        outputs.find((o) => o.name?.includes('Launchpad X')) ?? null;
      enterProgrammer();
    };
    window.addEventListener('midi-ready', handler);
    return () => window.removeEventListener('midi-ready', handler);
  }, [outputs, enterProgrammer]);

  return {
    inputs,
    outputs,
    send,
    listen,
    returnToLive,
  };
}
