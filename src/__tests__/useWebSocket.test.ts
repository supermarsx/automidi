import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: (() => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: ((ev?: unknown) => void) | null = null;
  public onmessage: ((ev: { data: string }) => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(): void {}

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({});
  }

  // helper for tests
  triggerClose() {
    this.close();
  }
}

const originalWebSocket = global.WebSocket;

describe('useWebSocket unlimited reconnects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances.length = 0;
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.WebSocket = originalWebSocket;
  });

  it('reconnects indefinitely when maxReconnectAttempts is 0', () => {
    const attempts = 5;

    renderHook(() =>
      useWebSocket({
        url: 'ws://localhost',
        autoReconnect: true,
        reconnectInterval: 100,
        maxReconnectAttempts: 0,
      }),
    );

    act(() => {
      window.dispatchEvent(new Event('load'));
    });

    for (let i = 0; i < attempts; i++) {
      const ws = MockWebSocket.instances[i];
      act(() => {
        ws.triggerClose();
      });
      vi.advanceTimersByTime(1000);
    }

    expect(MockWebSocket.instances.length).toBeGreaterThan(attempts);
  });
});
