import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePadActions } from './usePadActions';
import type { MidiMessage } from './useMidi';

interface MockStore {
  padActions: Record<string, { noteOn?: string; confirm?: boolean }>;
  padChannels: Record<string, number>;
  padColours: Record<string, unknown>;
  settings: { sysexColorMode: boolean };
  setPadChannel: (id: string, ch: number) => void;
}

let messageHandler: ((msg: MidiMessage) => void) | undefined;
const sendMock = vi.fn();
const playMacroMock = vi.fn();
const addToastMock = vi.fn();
let storeState: MockStore;
const setPadChannelMock = vi.fn((id: string, ch: number) => {
  storeState.padChannels[id] = ch;
});

vi.mock('./useMidi', () => ({
  useMidi: () => ({
    listen: (fn: (msg: MidiMessage) => void) => {
      messageHandler = fn;
      return () => {};
    },
    send: sendMock,
  }),
}));

vi.mock('./useKeyMacroPlayer', () => ({
  useKeyMacroPlayer: () => ({ playMacro: playMacroMock }),
}));

vi.mock('./toastStore', () => ({
  useToastStore: { getState: () => ({ addToast: addToastMock }) },
}));

vi.mock('./notify', () => ({ notify: vi.fn() }));

vi.mock('./store', () => ({
  useStore: (selector: (state: typeof storeState) => unknown) =>
    selector(storeState),
}));

describe('usePadActions confirmation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sendMock.mockClear();
    playMacroMock.mockClear();
    addToastMock.mockClear();
    setPadChannelMock.mockClear();
    storeState = {
      padActions: { 'n-60': { noteOn: 'macro1', confirm: true } },
      padChannels: { 'n-60': 1 },
      padColours: {},
      settings: { sysexColorMode: false },
      setPadChannel: setPadChannelMock,
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('runs playMacro when pad pressed twice within timeout', () => {
    renderHook(() => usePadActions());

    act(() => {
      messageHandler!({
        message: [0x90, 60, 127],
        direction: 'in',
        timestamp: Date.now(),
      });
    });

    act(() => {
      messageHandler!({
        message: [0x90, 60, 127],
        direction: 'in',
        timestamp: Date.now(),
      });
    });

    expect(playMacroMock).toHaveBeenCalledWith('macro1');
    expect(setPadChannelMock).toHaveBeenCalledWith('n-60', 3);
    expect(setPadChannelMock).toHaveBeenCalledWith('n-60', 1);
    expect(sendMock).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(2000);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('shows confirmation then resets after timeout', () => {
    renderHook(() => usePadActions());

    act(() => {
      messageHandler!({
        message: [0x90, 60, 127],
        direction: 'in',
        timestamp: Date.now(),
      });
    });

    expect(playMacroMock).not.toHaveBeenCalled();
    expect(setPadChannelMock).toHaveBeenCalledWith('n-60', 3);
    expect(sendMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);

    expect(setPadChannelMock).toHaveBeenCalledWith('n-60', 1);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(playMacroMock).not.toHaveBeenCalled();
  });
});
