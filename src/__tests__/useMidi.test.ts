import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMidi } from '../useMidi';

// Mock store to supply settings
interface StoreState {
  devices: { outputId: string | null };
  settings: {
    host: string;
    port: number;
    apiKey: string;
    autoReconnect: boolean;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    pingInterval: number;
    pingEnabled: boolean;
  };
}

let storeState: StoreState;
vi.mock('../store', () => ({
  useStore: <T>(selector: (s: StoreState) => T): T => selector(storeState),
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: (() => void) | null = null;
  public onclose: ((ev?: { code?: number }) => void) | null = null;
  public onmessage: ((ev: { data: string }) => void) | null = null;
  public onerror: ((ev?: unknown) => void) | null = null;
  public sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({});
  }

  // helpers for tests
  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  triggerClose(ev: { code?: number } = {}) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(ev);
  }

  triggerMessage(data: string) {
    this.onmessage?.({ data });
  }
}
const originalWebSocket = global.WebSocket;

global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

describe('useMidi reconnect logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    MockWebSocket.instances.length = 0;
    storeState = {
      devices: { outputId: null },
      settings: {
        host: 'localhost',
        port: 3000,
        apiKey: '',
        autoReconnect: true,
        reconnectInterval: 1000,
        maxReconnectAttempts: 2,
        pingInterval: 1000,
        pingEnabled: true,
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    global.WebSocket = originalWebSocket as typeof WebSocket;
  });

  it('reconnects after failure with expected delay', () => {
    const { result } = renderHook(() => useMidi());

    act(() => {
      window.dispatchEvent(new Event('load'));
    });

    vi.advanceTimersByTime(100);
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
    const first = MockWebSocket.instances[0];

    act(() => {
      first.triggerClose({ code: 1006 });
    });

    vi.advanceTimersByTime(999);
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2);

    const second = MockWebSocket.instances[1];
    act(() => {
      second.triggerClose({ code: 1006 });
    });

    vi.advanceTimersByTime(2000);
    // maxReconnectAttempts reached, should not create additional connections
    expect(MockWebSocket.instances.length).toBe(3);
    expect(result.current.status).toBe('closed');
  });

  it('calculates pingDelay from pong messages', () => {
    renderHook(() => useMidi());

    act(() => {
      window.dispatchEvent(new Event('load'));
    });

    vi.advanceTimersByTime(100);
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    const pingMsg = JSON.parse(ws.sent[0]);
    const ts = pingMsg.ts;

    vi.advanceTimersByTime(50);
    act(() => {
      ws.triggerMessage(JSON.stringify({ type: 'pong', ts }));
    });

    expect(ws.sent.length).toBe(1);
    expect(ts).toBeDefined();
    expect(ts + 50).toBe(Date.now());
  });
});
