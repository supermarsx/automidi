import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let useToastStore: typeof import('./toastStore').useToastStore;
let initialState: ReturnType<
  typeof import('./toastStore').useToastStore.getState
>;

describe('useToastStore', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const mod = await import('./toastStore');
    useToastStore = mod.useToastStore;
    initialState = useToastStore.getState();
    useToastStore.setState(initialState, true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('limits the number of toasts to five', () => {
    const add = useToastStore.getState().addToast;
    for (let i = 0; i < 6; i++) {
      add(`msg${i}`, 'success');
    }
    expect(useToastStore.getState().toasts).toHaveLength(5);
  });

  it('removes toasts after the timeout', () => {
    const add = useToastStore.getState().addToast;
    add('hello', 'success');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
