import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

let useStore: typeof import('./store').useStore;

describe('useStore actions', () => {
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./store');
    useStore = mod.useStore;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reorderMacro moves macros and ignores invalid indexes', () => {
    const { addMacro, reorderMacro } = useStore.getState();
    addMacro({ id: '1', name: 'one' });
    addMacro({ id: '2', name: 'two' });
    addMacro({ id: '3', name: 'three' });

    reorderMacro(0, 2);
    expect(useStore.getState().macros.map((m) => m.id)).toEqual([
      '2',
      '3',
      '1',
    ]);

    reorderMacro(3, 0);
    expect(useStore.getState().macros.map((m) => m.id)).toEqual([
      '2',
      '3',
      '1',
    ]);
  });

  it('setReconnectInterval enforces minimum value', () => {
    useStore.getState().setReconnectInterval(500);
    expect(useStore.getState().settings.reconnectInterval).toBe(1000);

    useStore.getState().setReconnectInterval(1500);
    expect(useStore.getState().settings.reconnectInterval).toBe(1500);
  });

  it('setMaxReconnectAttempts enforces bounds', () => {
    useStore.getState().setMaxReconnectAttempts(0);
    expect(useStore.getState().settings.maxReconnectAttempts).toBe(1);

    useStore.getState().setMaxReconnectAttempts(150);
    expect(useStore.getState().settings.maxReconnectAttempts).toBe(99);

    useStore.getState().setMaxReconnectAttempts(50);
    expect(useStore.getState().settings.maxReconnectAttempts).toBe(50);
  });
});
