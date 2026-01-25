/**
 * Tauri Store integration for persistent settings and data
 */

import { isTauri, getTauriAPI } from './tauri';

interface TauriStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  entries(): Promise<Array<[string, unknown]>>;
  keys(): Promise<string[]>;
  values(): Promise<unknown[]>;
  length(): Promise<number>;
  has(key: string): Promise<boolean>;
  save(): Promise<void>;
}

let storeInstance: TauriStore | null = null;

/**
 * Get or create Tauri Store instance
 */
async function getStore(): Promise<TauriStore | null> {
  if (!isTauri()) {
    return null;
  }

  if (storeInstance) {
    return storeInstance;
  }

  try {
    const tauri = getTauriAPI();
    if (!tauri || !tauri.store) {
      console.warn('Tauri Store plugin not available');
      return null;
    }

    const { Store } = tauri.store;
    storeInstance = await Store.load('automidi.json', { autoSave: true });
    return storeInstance;
  } catch (error) {
    console.error('Failed to initialize Tauri Store:', error);
    return null;
  }
}

/**
 * Save settings to Tauri Store
 */
export async function saveSettings(settings: Record<string, unknown>): Promise<boolean> {
  const store = await getStore();
  if (!store) return false;

  try {
    await store.set('settings', settings);
    await store.save();
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * Load settings from Tauri Store
 */
export async function loadSettings(): Promise<Record<string, unknown> | null> {
  const store = await getStore();
  if (!store) return null;

  try {
    const settings = await store.get('settings');
    if (!settings || typeof settings !== 'object') {
      return null;
    }
    return settings as Record<string, unknown>;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}

/**
 * Save macros to Tauri Store
 */
export async function saveMacros(macros: unknown[]): Promise<boolean> {
  const store = await getStore();
  if (!store) return false;

  try {
    await store.set('macros', macros);
    await store.save();
    return true;
  } catch (error) {
    console.error('Failed to save macros:', error);
    return false;
  }
}

/**
 * Load macros from Tauri Store
 */
export async function loadMacros(): Promise<unknown[] | null> {
  const store = await getStore();
  if (!store) return null;

  try {
    const macros = await store.get('macros');
    if (!Array.isArray(macros)) {
      return null;
    }
    return macros;
  } catch (error) {
    console.error('Failed to load macros:', error);
    return null;
  }
}

/**
 * Save configurations to Tauri Store
 */
export async function saveConfigs(configs: unknown[]): Promise<boolean> {
  const store = await getStore();
  if (!store) return false;

  try {
    await store.set('configs', configs);
    await store.save();
    return true;
  } catch (error) {
    console.error('Failed to save configs:', error);
    return false;
  }
}

/**
 * Load configurations from Tauri Store
 */
export async function loadConfigs(): Promise<unknown[] | null> {
  const store = await getStore();
  if (!store) return null;

  try {
    const configs = await store.get('configs');
    if (!Array.isArray(configs)) {
      return null;
    }
    return configs;
  } catch (error) {
    console.error('Failed to load configs:', error);
    return null;
  }
}

/**
 * Save pads configuration to Tauri Store
 */
export async function savePads(pads: Record<string, unknown>): Promise<boolean> {
  const store = await getStore();
  if (!store) return false;

  try {
    await store.set('pads', pads);
    await store.save();
    return true;
  } catch (error) {
    console.error('Failed to save pads:', error);
    return false;
  }
}

/**
 * Load pads configuration from Tauri Store
 */
export async function loadPads(): Promise<Record<string, unknown> | null> {
  const store = await getStore();
  if (!store) return null;

  try {
    const pads = await store.get('pads');
    if (!pads || typeof pads !== 'object') {
      return null;
    }
    return pads as Record<string, unknown>;
  } catch (error) {
    console.error('Failed to load pads:', error);
    return null;
  }
}

/**
 * Clear all stored data
 */
export async function clearStore(): Promise<boolean> {
  const store = await getStore();
  if (!store) return false;

  try {
    await store.clear();
    await store.save();
    return true;
  } catch (error) {
    console.error('Failed to clear store:', error);
    return false;
  }
}
