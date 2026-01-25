import { describe, it, expect } from 'vitest';
import {
  noteOn,
  noteOff,
  cc,
  enterProgrammerMode,
  setLedRGB,
} from './midiMessages';

describe('MIDI message helpers', () => {
  it('noteOn generates correct messages for different channels', () => {
    expect(noteOn(60, 127)).toEqual([0x90, 60, 127]);
    expect(noteOn(64, 100, 3)).toEqual([0x92, 64, 100]);
  });

  it('noteOff generates correct messages for different channels', () => {
    expect(noteOff(60)).toEqual([0x80, 60, 0]);
    expect(noteOff(67, 30, 4)).toEqual([0x83, 67, 30]);
  });

  it('cc generates correct messages on various channels', () => {
    expect(cc(1, 127)).toEqual([0xb0, 1, 127]);
    expect(cc(10, 55, 9)).toEqual([0xb8, 10, 55]);
  });

  it('enterProgrammerMode returns expected SysEx sequence', () => {
    expect(enterProgrammerMode()).toEqual([
      0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x01, 0xf7,
    ]);
  });

  it('setLedRGB builds RGB SysEx correctly', () => {
    expect(setLedRGB(42, 1, 2, 3)).toEqual([
      0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x03, 42, 1, 2, 3, 0xf7,
    ]);
  });
});
