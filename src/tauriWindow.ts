/**
 * Tauri window management utilities
 */

import { isTauri, getTauriAPI } from './tauri';

/**
 * Get the current window
 */
export function getCurrentWindow() {
  if (!isTauri()) {
    return null;
  }

  const tauri = getTauriAPI();
  if (!tauri || !tauri.window) {
    return null;
  }

  return tauri.window.getCurrentWindow();
}

/**
 * Minimize the window
 */
export async function minimizeWindow(): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.minimize();
  }
}

/**
 * Maximize the window
 */
export async function maximizeWindow(): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.maximize();
  }
}

/**
 * Toggle maximize/unmaximize
 */
export async function toggleMaximize(): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.toggleMaximize();
  }
}

/**
 * Close the window
 */
export async function closeWindow(): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.close();
  }
}

/**
 * Check if window is maximized
 */
export async function isMaximized(): Promise<boolean> {
  const window = getCurrentWindow();
  if (window) {
    return await window.isMaximized();
  }
  return false;
}

/**
 * Set window title
 */
export async function setWindowTitle(title: string): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.setTitle(title);
  }
}

/**
 * Set window always on top
 */
export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.setAlwaysOnTop(alwaysOnTop);
  }
}

/**
 * Show the window
 */
export async function showWindow(): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.show();
  }
}

/**
 * Hide the window
 */
export async function hideWindow(): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.hide();
  }
}

/**
 * Focus the window
 */
export async function focusWindow(): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.setFocus();
  }
}

/**
 * Get window position
 */
export async function getWindowPosition(): Promise<{ x: number; y: number } | null> {
  const window = getCurrentWindow();
  if (window) {
    const position = await window.outerPosition();
    return { x: position.x, y: position.y };
  }
  return null;
}

/**
 * Set window position
 */
export async function setWindowPosition(x: number, y: number): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.setPosition({ x, y });
  }
}

/**
 * Get window size
 */
export async function getWindowSize(): Promise<{ width: number; height: number } | null> {
  const window = getCurrentWindow();
  if (window) {
    const size = await window.outerSize();
    return { width: size.width, height: size.height };
  }
  return null;
}

/**
 * Set window size
 */
export async function setWindowSize(width: number, height: number): Promise<void> {
  const window = getCurrentWindow();
  if (window) {
    await window.setSize({ width, height });
  }
}
