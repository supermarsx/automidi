import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { RefObject } from 'react';
import { usePing } from './usePing';

const originalWebSocket = globalThis.WebSocket;

function createWsRef(): {
  wsRef: RefObject<WebSocket>;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
} {
  const send = vi.fn();
  const close = vi.fn();
  return {
    wsRef: {
      current: {
        send,
        close,
        readyState: WebSocket.OPEN,
      } as unknown as WebSocket,
    },
    send,
    close,
  };
}

describe('usePing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.WebSocket = { OPEN: 1 } as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
  });

  it('schedules pings on start', () => {
    const { wsRef, send } = createWsRef();
    const { result } = renderHook(() => usePing(wsRef, true, 1000));

    act(() => {
      result.current.start();
    });

    expect(send).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('handles pong and updates delay', () => {
    const { wsRef, send } = createWsRef();
    const { result } = renderHook(() => usePing(wsRef, true, 1000));

    vi.setSystemTime(1000);
    act(() => {
      result.current.start();
    });
    const pingTs = JSON.parse(send.mock.calls[0][0]).ts;

    vi.setSystemTime(1500);
    act(() => {
      result.current.handlePong(pingTs);
    });

    expect(result.current.pingDelay).toBe(500);
  });

  it('reconnects after missed pongs', () => {
    const { wsRef, send, close } = createWsRef();
    const { result } = renderHook(() => usePing(wsRef, true, 100, true));

    act(() => {
      result.current.start();
    });

    vi.advanceTimersByTime(100); // second ping
    vi.advanceTimersByTime(100); // third ping
    vi.advanceTimersByTime(100); // triggers reconnect

    expect(close).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('cleans up on stop and when disabled', () => {
    const { wsRef, send } = createWsRef();
    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) => usePing(wsRef, props.enabled, 100),
      { initialProps: { enabled: true } },
    );

    act(() => {
      result.current.start();
    });
    expect(send).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.stop();
    });
    vi.advanceTimersByTime(500);
    expect(send).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    act(() => {
      result.current.start();
    });
    vi.advanceTimersByTime(500);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
