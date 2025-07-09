import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Macro } from './store';
import { useKeyMacroPlayer } from './useKeyMacroPlayer';

let fetchMock: ReturnType<typeof vi.fn>;
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

describe('useKeyMacroPlayer fetch calls', () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal('fetch', fetchMock);
    storeState = { macros: [], settings: { apiKey: 'key' } };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const cases: Array<[Macro, string, Record<string, unknown>]> = [
    [
      { id: '1', name: 'a', type: 'app', command: 'calc' },
      '/run/app',
      { app: 'calc' },
    ],
    [
      { id: '1', name: 's', type: 'shell', command: 'ls' },
      '/run/shell',
      { cmd: 'ls' },
    ],
    [
      { id: '1', name: 'sw', type: 'shell_win', command: 'dir' },
      '/run/shellWin',
      { cmd: 'dir' },
    ],
    [
      { id: '1', name: 'sb', type: 'shell_bg', command: 'sleep' },
      '/run/shellBg',
      { cmd: 'sleep' },
    ],
    [
      {
        id: '1',
        name: 'k',
        type: 'keys',
        sequence: ['a'],
        interval: 20,
      },
      '/keys/type',
      { sequence: ['a'], interval: 20 },
    ],
  ];

  it.each(cases)('plays %s macro', async (macro, url, body) => {
    storeState.macros = [macro];
    const { result } = renderHook(() => useKeyMacroPlayer());
    await act(async () => {
      await result.current.playMacro('1');
    });
    expect(fetchMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'key' }),
        body: JSON.stringify(body),
      }),
    );
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
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/keys/type',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/run/shell',
      expect.any(Object),
    );
  });
});
