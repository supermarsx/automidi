import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

interface StoreState {
  devices: { outputId: string | null };
}

let storeState: StoreState;

vi.mock('./store', () => ({
  useStore: <T>(selector: (s: StoreState) => T): T => selector(storeState),
}));

const sendMock = vi.fn();
const listenMock = vi.fn(() => () => {});
const reconnectMock = vi.fn();

vi.mock('./useMidiConnection', () => ({
  useMidiConnection: () => ({
    status: 'connected',
    pingDelay: 0,
    send: sendMock,
    listen: listenMock,
    reconnect: reconnectMock,
  }),
}));

import { useMidi } from './useMidi';

describe('useMidi timeout cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sendMock.mockReset();
    storeState = { devices: { outputId: null } };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not send message if unmounted before timeout', () => {
    const { unmount } = renderHook(() => useMidi());
    unmount();
    vi.advanceTimersByTime(1000);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
