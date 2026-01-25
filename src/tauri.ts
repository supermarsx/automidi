/**
 * Tauri runtime detection and utilities
 */

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  const result = typeof window !== 'undefined' && '__TAURI__' in window;
  console.log('[Tauri Detection]', {
    windowExists: typeof window !== 'undefined',
    hasTauriGlobal: typeof window !== 'undefined' && '__TAURI__' in window,
    result,
    tauriAPI: typeof window !== 'undefined' ? (window as any).__TAURI__ : undefined
  });
  return result;
}

/**
 * Get Tauri API if available
 */
export function getTauriAPI() {
  if (isTauri()) {
    return (window as any).__TAURI__;
  }
  return null;
}

/**
 * Invoke a Tauri command
 */
export async function invoke<T = any>(
  command: string,
  args?: Record<string, any>
): Promise<T> {
  const tauri = getTauriAPI();
  if (!tauri) {
    throw new Error('Tauri API not available');
  }
  return tauri.core.invoke(command, args);
}

/**
 * Listen to Tauri events
 */
export async function listen<T = any>(
  event: string,
  handler: (payload: T) => void
): Promise<() => void> {
  const tauri = getTauriAPI();
  if (!tauri) {
    return () => {};
  }
  return tauri.event.listen(event, (e: any) => handler(e.payload));
}

/**
 * Emit a Tauri event
 */
export async function emit(event: string, payload?: any): Promise<void> {
  const tauri = getTauriAPI();
  if (!tauri) {
    return;
  }
  return tauri.event.emit(event, payload);
}
