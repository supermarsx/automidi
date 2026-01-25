import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const invokeMock = vi.fn();
const listenMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: unknown[]) => listenMock(...args),
}));

vi.mock('../store', () => ({
  useStore: <T>(selector: (s: unknown) => T): T =>
    selector({
      settings: {
        pingInterval: 1000,
        pingEnabled: false,
        reconnectOnLost: false,
      },
    }),
}));

vi.mock('../toastStore', () => ({
  useToastStore: (selector: (s: { addToast: () => void }) => unknown) =>
    selector({ addToast: () => undefined }),
}));

vi.mock('../usePing', () => ({
  usePing: () => ({
    pingDelay: null,
    handlePong: () => undefined,
    start: () => undefined,
    stop: () => undefined,
  }),
}));

import { useMidiConnection } from '../useMidiConnection';

describe('useMidiConnection (Tauri)', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    listenMock.mockReset();
    (globalThis as Record<string, unknown>).__TAURI__ = {};
    listenMock.mockResolvedValue(() => undefined);
    invokeMock.mockResolvedValue({ inputs: [], outputs: [] });
  });

  it('maps send to tauri invoke', () => {
    const { result } = renderHook(() => useMidiConnection());
    act(() => {
      result.current.send({ type: 'send', port: '1', bytes: [1, 2, 3] });
    });
    expect(invokeMock).toHaveBeenCalledWith('midiSend', {
      portId: '1',
      bytes: [1, 2, 3],
    });
  });

  it('emits devices on getDevices', async () => {
    invokeMock.mockResolvedValueOnce({
      inputs: [{ id: 'in-1', name: 'Input' }],
      outputs: [{ id: 'out-1', name: 'Output' }],
    });
    const { result } = renderHook(() => useMidiConnection());
    const messages: unknown[] = [];
    const unlisten = result.current.listen((msg) => messages.push(msg));

    act(() => {
      result.current.send({ type: 'getDevices' });
    });

    await waitFor(() =>
      expect(messages.some((m) => (m as { type?: string }).type === 'devices')).toBe(
        true,
      ),
    );
    unlisten();
  });

  it('registers event listeners on mount', async () => {
    renderHook(() => useMidiConnection());
    await waitFor(() => expect(listenMock).toHaveBeenCalled());
    const events = listenMock.mock.calls.map((call) => call[0]);
    expect(events).toEqual(
      expect.arrayContaining(['midi:event', 'midi:devices', 'shell:output']),
    );
  });
});
