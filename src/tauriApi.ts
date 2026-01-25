/**
 * Tauri API exports - single import point for all Tauri functionality
 */

// Core utilities
export {
  isTauri,
  getTauriAPI,
  invoke,
  listen,
  emit,
} from './tauri';

// Store persistence
export {
  saveSettings,
  loadSettings,
  saveMacros,
  loadMacros,
  saveConfigs,
  loadConfigs,
  savePads,
  loadPads,
  clearStore,
} from './tauriStore';

// Migration utilities
export {
  needsMigration,
  migrateToTauriStore,
  clearIndexedDBData,
  performMigrationWorkflow,
} from './tauriMigration';

// Dialogs
export {
  openFile,
  saveFile,
  readTextFile,
  writeTextFile,
  showMessage,
  showConfirm,
} from './tauriDialogs';

// Window management
export {
  getCurrentWindow,
  minimizeWindow,
  maximizeWindow,
  toggleMaximize,
  closeWindow,
  isMaximized,
  setWindowTitle,
  setAlwaysOnTop,
  showWindow,
  hideWindow,
  focusWindow,
  getWindowPosition,
  setWindowPosition,
  getWindowSize,
  setWindowSize,
} from './tauriWindow';

// Persistence hooks
export {
  useLoadTauriStore,
  usePersistSettings,
  usePersistMacros,
  usePersistConfigs,
  usePersistPads,
  useTauriPersistence,
} from './useTauriPersistence';

// MIDI connection
export { useTauriMidiConnection } from './useTauriMidiConnection';

// Type exports
export type { DialogOptions } from './tauriDialogs';
