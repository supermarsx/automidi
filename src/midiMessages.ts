export interface LedColourSpec {
  id: number;
  red: number;
  green: number;
  blue: number;
}

function clamp7(value: number): number {
  return value & 0x7f;
}

export const CHANNEL_STATIC = 1; // Channel 1 - static colour
export const CHANNEL_FLASHING = 2; // Channel 2 - flashing colour
export const CHANNEL_PULSING = 3; // Channel 3 - pulsing colour

export function noteOn(note: number, velocity: number, channel = 1): number[] {
  return [0x90 | clamp7(channel - 1), clamp7(note), clamp7(velocity)];
}

export function noteOff(note: number, velocity = 0, channel = 1): number[] {
  return [0x80 | clamp7(channel - 1), clamp7(note), clamp7(velocity)];
}

export function cc(ccNum: number, value: number, channel = 1): number[] {
  return [0xb0 | clamp7(channel - 1), clamp7(ccNum), clamp7(value)];
}

const LAUNCHPAD_HEADER = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c] as const;

export function sysex(command: number, ...data: number[]): number[] {
  return [...LAUNCHPAD_HEADER, clamp7(command), ...data.map(clamp7), 0xf7];
}

// Launchpad X specific SysEx commands according to programmer's reference
export function enterProgrammerMode(): number[] {
  return sysex(0x0e, 0x01);
}

export function exitProgrammerMode(): number[] {
  return sysex(0x0e, 0x00);
}

export function ledLighting(colours: LedColourSpec[]): number[] {
  const data: number[] = [];
  for (const c of colours) {
    data.push(clamp7(c.id), clamp7(c.red), clamp7(c.green), clamp7(c.blue));
  }
  return sysex(0x03, ...data);
}

export function setBrightness(brightness: number): number[] {
  return sysex(0x08, clamp7(brightness));
}

export function setSleepMode(enabled: boolean): number[] {
  return sysex(0x09, enabled ? 0x01 : 0x00);
}

export function clearAllLeds(): number[] {
  return sysex(0x0e, 0x00);
}

export function scrollText(text: string, loop = false, speed = 7): number[] {
  const textBytes = Array.from(text).map((c) => c.codePointAt(0) || 0);
  return sysex(
    0x07,
    loop ? 0x01 : 0x00,
    0x00,
    clamp7(speed),
    ...textBytes,
    0x00,
  );
}

// Layout commands
export function setLayout(layout: number): number[] {
  return sysex(0x00, clamp7(layout));
}

// DAW mode commands
export function setDAWMode(faderBank: number): number[] {
  return sysex(0x10, clamp7(faderBank));
}

// Programmer mode LED commands
export function setLedSolid(id: number, color: number): number[] {
  return sysex(0x0a, clamp7(id), clamp7(color));
}

export function setLedFlashing(id: number, color: number): number[] {
  return sysex(0x23, clamp7(id), clamp7(color));
}

export function setLedPulsing(id: number, color: number): number[] {
  return sysex(0x28, clamp7(id), clamp7(color));
}

export function midiClock(): number[] {
  return [0xf8];
}

export function setLedRGB(
  id: number,
  red: number,
  green: number,
  blue: number,
): number[] {
  return sysex(0x03, clamp7(id), clamp7(red), clamp7(green), clamp7(blue));
}

export interface LightingSpec {
  type: number;
  index: number;
  data: number[];
}

export function lightingSysEx(specs: LightingSpec[]): number[] {
  const data: number[] = [];
  for (const s of specs) {
    data.push(clamp7(s.type), clamp7(s.index), ...s.data.map(clamp7));
  }
  return sysex(0x03, ...data);
}
