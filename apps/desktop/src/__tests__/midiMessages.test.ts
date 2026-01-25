import { describe, test, expect } from 'vitest';
import {
  noteOn,
  noteOff,
  cc,
  sysex,
  enterProgrammerMode,
  exitProgrammerMode,
  ledLighting,
  setBrightness,
  setSleepMode,
  clearAllLeds,
  scrollText,
  setLayout,
  setDAWMode,
  setLedSolid,
  setLedFlashing,
  setLedPulsing,
  midiClock,
  setLedRGB,
  lightingSysEx,
} from '../midiMessages';

describe('midiMessages', () => {
  const HEADER = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c];

  test('noteOn', () => {
    expect(noteOn(60, 127)).toEqual([0x90, 60, 127]);
    expect(noteOn(200, 300, 16)).toEqual([0x9f, 127, 127]);
  });

  test('noteOff', () => {
    expect(noteOff(60)).toEqual([0x80, 60, 0]);
    expect(noteOff(200, 300, 18)).toEqual([0x91, 127, 127]);
  });

  test('cc', () => {
    expect(cc(1, 127)).toEqual([0xb0, 1, 127]);
    expect(cc(200, 300, 16)).toEqual([0xbf, 127, 127]);
  });

  test('sysex', () => {
    expect(sysex(0x0e, 1, 2)).toEqual([...HEADER, 0x0e, 1, 2, 0xf7]);
    expect(sysex(300, 400, -1)).toEqual([...HEADER, 127, 127, 0, 0xf7]);
  });

  test('enterProgrammerMode / exitProgrammerMode', () => {
    expect(enterProgrammerMode()).toEqual([...HEADER, 0x0e, 0x01, 0xf7]);
    expect(exitProgrammerMode()).toEqual([...HEADER, 0x0e, 0x00, 0xf7]);
  });

  test('ledLighting', () => {
    expect(ledLighting([{ id: 1, red: 2, green: 3, blue: 4 }])).toEqual([
      ...HEADER,
      0x03,
      1,
      2,
      3,
      4,
      0xf7,
    ]);
    expect(ledLighting([{ id: 200, red: 256, green: -1, blue: 700 }])).toEqual([
      ...HEADER,
      0x03,
      127,
      127,
      0,
      127,
      0xf7,
    ]);
  });

  test('setBrightness', () => {
    expect(setBrightness(40)).toEqual([...HEADER, 0x08, 40, 0xf7]);
    expect(setBrightness(200)).toEqual([...HEADER, 0x08, 127, 0xf7]);
  });

  test('setSleepMode', () => {
    expect(setSleepMode(true)).toEqual([...HEADER, 0x09, 0x01, 0xf7]);
    expect(setSleepMode(false)).toEqual([...HEADER, 0x09, 0x00, 0xf7]);
  });

  test('clearAllLeds', () => {
    expect(clearAllLeds()).toEqual([...HEADER, 0x0e, 0x00, 0xf7]);
  });

  test('scrollText', () => {
    expect(scrollText('Hi')).toEqual([
      ...HEADER,
      0x07,
      0x00,
      0x00,
      7,
      72,
      105,
      0x00,
      0xf7,
    ]);
    expect(scrollText('A', false, 200)).toEqual([
      ...HEADER,
      0x07,
      0x00,
      0x00,
      127,
      65,
      0x00,
      0xf7,
    ]);
  });

  test('setLayout', () => {
    expect(setLayout(5)).toEqual([...HEADER, 0x00, 5, 0xf7]);
    expect(setLayout(200)).toEqual([...HEADER, 0x00, 127, 0xf7]);
  });

  test('setDAWMode', () => {
    expect(setDAWMode(2)).toEqual([...HEADER, 0x10, 2, 0xf7]);
    expect(setDAWMode(200)).toEqual([...HEADER, 0x10, 127, 0xf7]);
  });

  test('LED commands', () => {
    expect(setLedSolid(1, 5)).toEqual([...HEADER, 0x0a, 1, 5, 0xf7]);
    expect(setLedSolid(200, 300)).toEqual([...HEADER, 0x0a, 127, 127, 0xf7]);

    expect(setLedFlashing(2, 6)).toEqual([...HEADER, 0x23, 2, 6, 0xf7]);
    expect(setLedFlashing(200, 300)).toEqual([...HEADER, 0x23, 127, 127, 0xf7]);

    expect(setLedPulsing(3, 7)).toEqual([...HEADER, 0x28, 3, 7, 0xf7]);
    expect(setLedPulsing(200, 300)).toEqual([...HEADER, 0x28, 127, 127, 0xf7]);
  });

  test('midiClock', () => {
    expect(midiClock()).toEqual([0xf8]);
  });

  test('setLedRGB', () => {
    expect(setLedRGB(10, 1, 2, 3)).toEqual([
      ...HEADER,
      0x03,
      10,
      1,
      2,
      3,
      0xf7,
    ]);
    expect(setLedRGB(200, 300, 400, 500)).toEqual([
      ...HEADER,
      0x03,
      127,
      127,
      127,
      127,
      0xf7,
    ]);
  });

  test('lightingSysEx', () => {
    expect(
      lightingSysEx([
        { type: 1, index: 2, data: [3, 4] },
        { type: 5, index: 6, data: [7, 8] },
      ]),
    ).toEqual([...HEADER, 0x03, 1, 2, 3, 4, 5, 6, 7, 8, 0xf7]);

    expect(lightingSysEx([{ type: 300, index: -1, data: [400] }])).toEqual([
      ...HEADER,
      0x03,
      127,
      0,
      127,
      0xf7,
    ]);
  });
});
