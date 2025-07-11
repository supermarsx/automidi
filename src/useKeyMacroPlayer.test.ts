import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Macro } from './store';
import { useKeyMacroPlayer } from './useKeyMacroPlayer';

let sendMock: ReturnType<typeof vi.fn>;
let storeState: { macros: Macro[]; settings: { apiKey: string } };
const addToastMock = vi.fn();

vi.mock('./toastStore', () => ({
  useToastStore: { getState: () => ({ addToast: addToastMock }) },
}));

vi.mock('./store', () => ({
  useStore: Object.assign(
    (selector: (state: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState },
  ),
}));

vi.mock('./socket', () => ({
  sendSocketMessage: (...args: unknown[]) => sendMock(...args),
}));

describe('useKeyMacroPlayer socket messages', () => {
  beforeEach(() => {
    sendMock = vi.fn().mockReturnValue(true);
    storeState = { macros: [], settings: { apiKey: 'key' } };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const cases: Array<[Macro, string, Record<string, unknown>]> = [
    [
      { id: '1', name: 'a', type: 'app', command: 'calc' },
      'runApp',
      { app: 'calc' },
    ],
    [
      { id: '1', name: 's', type: 'shell', command: 'ls' },
      'runShell',
      { cmd: 'ls' },
    ],
    [
      { id: '1', name: 'sw', type: 'shell_win', command: 'dir' },
      'runShellWin',
      { cmd: 'dir' },
    ],
    [
      { id: '1', name: 'sb', type: 'shell_bg', command: 'sleep' },
      'runShellBg',
      { cmd: 'sleep' },
    ],
    [
      { id: '1', name: 'k', type: 'keys', sequence: ['a'], interval: 20 },
      'keysType',
      { sequence: ['a'], interval: 20 },
    ],
  ];

  it.each(cases)('plays %s macro', async (macro, type, payload) => {
    storeState.macros = [macro];
    const { result } = renderHook(() => useKeyMacroPlayer());
    await act(async () => {
      await result.current.playMacro('1');
    });
    expect(sendMock).toHaveBeenCalledWith({ type, ...payload });
  });

  it('recurses when nextId is set', async () => {
    storeState.macros = [
      {
        id: '1',
        name: 'first',
        type: 'keys',
        sequence: ['a'],
        interval: 10,
        nextId: '2',
      },
      { id: '2', name: 'next', type: 'shell', command: 'ls' },
    ];
    const { result } = renderHook(() => useKeyMacroPlayer());
    await act(async () => {
      await result.current.playMacro('1');
    });
    expect(sendMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'keysType' }),
    );
    expect(sendMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'runShell' }),
    );
  });
});
