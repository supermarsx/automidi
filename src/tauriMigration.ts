/**
 * IndexedDB to Tauri Store Migration Utility
 * 
 * This module helps migrate existing data from IndexedDB (web mode)
 * to Tauri Store (desktop mode) for a seamless transition.
 */

import { isTauri } from './tauri';
import {
  saveSettings,
  loadSettings,
  saveMacros,
  saveConfigs,
  savePads,
} from './tauriStore';

/**
 * Check if IndexedDB is available
 */
function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Read all data from IndexedDB
 */
async function readFromIndexedDB(): Promise<{
  settings?: unknown;
  macros?: unknown[];
  configs?: unknown[];
  pads?: unknown;
} | null> {
  if (!hasIndexedDB()) {
    return null;
  }

  try {
    // Using idb-keyval library pattern
    const db = await openIDB();
    
    const settings = await getIDBValue(db, 'settings');
    const macros = await getIDBValue(db, 'macros');
    const configs = await getIDBValue(db, 'configs');
    const pads = await getIDBValue(db, 'pads');

    return {
      settings: settings || undefined,
      macros: Array.isArray(macros) ? macros : undefined,
      configs: Array.isArray(configs) ? configs : undefined,
      pads: pads || undefined,
    };
  } catch (error) {
    console.error('Failed to read from IndexedDB:', error);
    return null;
  }
}

/**
 * Open IndexedDB connection
 */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('automidi-store', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keyval')) {
        db.createObjectStore('keyval');
      }
    };
  });
}

/**
 * Get value from IndexedDB
 */
function getIDBValue(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('keyval', 'readonly');
    const store = transaction.objectStore('keyval');
    const request = store.get(key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Check if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  if (!isTauri() || !hasIndexedDB()) {
    return false;
  }

  // Check if Tauri Store already has data
  const tauriSettings = await loadSettings();
  if (tauriSettings) {
    return false; // Already migrated
  }

  // Check if IndexedDB has data
  const idbData = await readFromIndexedDB();
  return !!(idbData && (
    idbData.settings ||
    idbData.macros?.length ||
    idbData.configs?.length ||
    idbData.pads
  ));
}

/**
 * Perform migration from IndexedDB to Tauri Store
 */
export async function migrateToTauriStore(): Promise<{
  success: boolean;
  migratedItems: string[];
  errors: string[];
}> {
  const migratedItems: string[] = [];
  const errors: string[] = [];

  if (!isTauri()) {
    errors.push('Not running in Tauri mode');
    return { success: false, migratedItems, errors };
  }

  if (!hasIndexedDB()) {
    errors.push('IndexedDB not available');
    return { success: false, migratedItems, errors };
  }

  try {
    const idbData = await readFromIndexedDB();
    
    if (!idbData) {
      errors.push('Failed to read from IndexedDB');
      return { success: false, migratedItems, errors };
    }

    // Migrate settings
    if (idbData.settings) {
      try {
        await saveSettings(idbData.settings as Record<string, unknown>);
        migratedItems.push('settings');
      } catch (error) {
        errors.push(`Failed to migrate settings: ${error}`);
      }
    }

    // Migrate macros
    if (idbData.macros && idbData.macros.length > 0) {
      try {
        await saveMacros(idbData.macros);
        migratedItems.push(`macros (${idbData.macros.length} items)`);
      } catch (error) {
        errors.push(`Failed to migrate macros: ${error}`);
      }
    }

    // Migrate configs
    if (idbData.configs && idbData.configs.length > 0) {
      try {
        await saveConfigs(idbData.configs);
        migratedItems.push(`configs (${idbData.configs.length} items)`);
      } catch (error) {
        errors.push(`Failed to migrate configs: ${error}`);
      }
    }

    // Migrate pads
    if (idbData.pads) {
      try {
        await savePads(idbData.pads as Record<string, unknown>);
        migratedItems.push('pads');
      } catch (error) {
        errors.push(`Failed to migrate pads: ${error}`);
      }
    }

    const success = migratedItems.length > 0;
    
    if (success) {
      console.log('Migration completed:', {
        migratedItems,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return { success, migratedItems, errors };
  } catch (error) {
    errors.push(`Migration failed: ${error}`);
    return { success: false, migratedItems, errors };
  }
}

/**
 * Clear IndexedDB data (call after successful migration)
 */
export async function clearIndexedDBData(): Promise<boolean> {
  if (!hasIndexedDB()) {
    return false;
  }

  try {
    const db = await openIDB();
    const transaction = db.transaction('keyval', 'readwrite');
    const store = transaction.objectStore('keyval');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    return true;
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
    return false;
  }
}

/**
 * Full migration workflow with confirmation
 */
export async function performMigrationWorkflow(): Promise<void> {
  try {
    const needsIt = await needsMigration();
    
    if (!needsIt) {
      console.log('No migration needed');
      return;
    }

    // In production, you might want to show a UI confirmation dialog
    const confirmed = confirm(
      'AutoMIDI has detected existing data from web mode.\n\n' +
      'Would you like to migrate your settings, macros, and configurations ' +
      'to the desktop app?\n\n' +
      'This is a one-time operation.'
    );

    if (!confirmed) {
      console.log('Migration cancelled by user');
      return;
    }

    console.log('Starting migration...');
    const result = await migrateToTauriStore();

    if (result.success) {
      alert(
        `Migration successful!\n\n` +
        `Migrated items:\n${result.migratedItems.join('\n')}\n\n` +
        (result.errors.length > 0
          ? `Warnings:\n${result.errors.join('\n')}\n\n`
          : '') +
        `The app will now reload.`
      );

      // Clear old data
      await clearIndexedDBData();

      // Reload the app to apply migrated data
      window.location.reload();
    } else {
      alert(
        `Migration failed.\n\n` +
        `Errors:\n${result.errors.join('\n')}\n\n` +
        `Your original data is still intact.`
      );
    }
  } catch (error) {
    console.error('Migration workflow error:', error);
    alert(`Migration error: ${error}`);
  }
}
