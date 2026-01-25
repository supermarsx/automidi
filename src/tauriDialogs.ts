/**
 * Tauri file dialog utilities
 */

import { isTauri, getTauriAPI } from './tauri';

export interface DialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

/**
 * Open a file picker dialog
 */
export async function openFile(
  options: DialogOptions = {}
): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const tauri = getTauriAPI();
    if (!tauri || !tauri.dialog) {
      console.warn('Tauri Dialog plugin not available');
      return null;
    }

    const { open } = tauri.dialog;
    const result = await open({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
      multiple: false,
      directory: false,
    });

    return result as string | null;
  } catch (error) {
    console.error('Failed to open file dialog:', error);
    return null;
  }
}

/**
 * Open a save file dialog
 */
export async function saveFile(
  options: DialogOptions = {}
): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const tauri = getTauriAPI();
    if (!tauri || !tauri.dialog) {
      console.warn('Tauri Dialog plugin not available');
      return null;
    }

    const { save } = tauri.dialog;
    const result = await save({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
    });

    return result as string | null;
  } catch (error) {
    console.error('Failed to open save dialog:', error);
    return null;
  }
}

/**
 * Read a text file
 */
export async function readTextFile(path: string): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const tauri = getTauriAPI();
    if (!tauri || !tauri.fs) {
      console.warn('Tauri FS plugin not available');
      return null;
    }

    const { readTextFile } = tauri.fs;
    return await readTextFile(path);
  } catch (error) {
    console.error('Failed to read file:', error);
    return null;
  }
}

/**
 * Write a text file
 */
export async function writeTextFile(
  path: string,
  content: string
): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    const tauri = getTauriAPI();
    if (!tauri || !tauri.fs) {
      console.warn('Tauri FS plugin not available');
      return false;
    }

    const { writeTextFile } = tauri.fs;
    await writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error('Failed to write file:', error);
    return false;
  }
}

/**
 * Show a message dialog
 */
export async function showMessage(
  message: string,
  options: {
    title?: string;
    type?: 'info' | 'warning' | 'error';
  } = {}
): Promise<void> {
  if (!isTauri()) {
    alert(message);
    return;
  }

  try {
    const tauri = getTauriAPI();
    if (!tauri || !tauri.dialog) {
      alert(message);
      return;
    }

    const { message: showMessageDialog } = tauri.dialog;
    await showMessageDialog(message, {
      title: options.title || 'AutoMIDI',
      type: options.type || 'info',
    });
  } catch (error) {
    console.error('Failed to show message dialog:', error);
    alert(message);
  }
}

/**
 * Show a confirmation dialog
 */
export async function showConfirm(
  message: string,
  options: {
    title?: string;
    type?: 'info' | 'warning' | 'error';
  } = {}
): Promise<boolean> {
  if (!isTauri()) {
    return confirm(message);
  }

  try {
    const tauri = getTauriAPI();
    if (!tauri || !tauri.dialog) {
      return confirm(message);
    }

    const { confirm: showConfirmDialog } = tauri.dialog;
    const result = await showConfirmDialog(message, {
      title: options.title || 'AutoMIDI',
      type: options.type || 'info',
    });
    return result;
  } catch (error) {
    console.error('Failed to show confirm dialog:', error);
    return confirm(message);
  }
}
