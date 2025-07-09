import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

let useStore: typeof import('./store').useStore;
let useLogStore: typeof import('./logStore').useLogStore;

type StoreState = ReturnType<typeof useStore.getState>;

let initialMain: StoreState;
let initialLogs: ReturnType<typeof import('./logStore').useLogStore.getState>;

describe('useLogStore', () => {
  beforeEach(async () => {
    vi.resetModules();
    const storeMod = await import('./store');
    const logMod = await import('./logStore');
    useStore = storeMod.useStore;
    useLogStore = logMod.useLogStore;
    initialMain = useStore.getState();
    initialLogs = useLogStore.getState();
    useStore.setState(initialMain, true);
    useLogStore.setState(initialLogs, true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('addMessage respects the logLimit setting', () => {
    useStore.getState().setLogLimit(2);
    const add = useLogStore.getState().addMessage;
    add({ direction: 'in', message: [1], timestamp: 1 });
    add({ direction: 'in', message: [2], timestamp: 2 });
    add({ direction: 'in', message: [3], timestamp: 3 });
    const logs = useLogStore.getState().logs;
    expect(logs).toHaveLength(2);
    expect(logs[0].message).toEqual([2]);
    expect(logs[1].message).toEqual([3]);
  });
});
