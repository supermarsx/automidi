export interface LedColourSpec {
  id: number;
  red: number;
  green: number;
  blue: number;
}

function clamp7(value: number): number {
  return value & 0x7f;
}

export function noteOn(
  note: number,
  velocity: number,
  channel = 1,
): Uint8Array {
  return new Uint8Array([
    0x90 | clamp7(channel - 1),
    clamp7(note),
    clamp7(velocity),
  ]);
}

export function cc(ccNum: number, value: number, channel = 1): Uint8Array {
  return new Uint8Array([
    0xb0 | clamp7(channel - 1),
    clamp7(ccNum),
    clamp7(value),
  ]);
}

const LAUNCHPAD_HEADER = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c] as const;

export function sysex(command: number, ...data: number[]): Uint8Array {
  return new Uint8Array([
    ...LAUNCHPAD_HEADER,
    clamp7(command),
    ...data.map(clamp7),
    0xf7,
  ]);
}

export function ledLighting(colours: LedColourSpec[]): Uint8Array {
  const data: number[] = [];
  for (const c of colours) {
    data.push(clamp7(c.id), clamp7(c.red), clamp7(c.green), clamp7(c.blue));
  }
  return sysex(0x03, ...data);
}
