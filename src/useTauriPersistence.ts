/**
 * Hook to sync Zustand store with Tauri Store for persistence
 */

import { useEffect } from 'react';
import { useStore } from './store';
import { isTauri } from './tauri';
import {
  saveSettings,
  loadSettings,
  saveMacros,
  loadMacros,
  saveConfigs,
  loadConfigs,
  savePads,
  loadPads,
} from './tauriStore';

/**
 * Hook to load persisted data from Tauri Store on mount
 */
export function useLoadTauriStore() {
  const setStore = useStore.setState;

  useEffect(() => {
    if (!isTauri()) return;

    const loadData = async () => {
      try {
        // Load settings
        const settings = await loadSettings();
        if (settings) {
          setStore((state) => ({
            settings: { ...state.settings, ...settings },
          }));
        }

        // Load macros
        const macros = await loadMacros();
        if (macros && Array.isArray(macros)) {
          setStore({ macros: macros as never[] }); // Type assertion needed for Zustand
        }

        // Load configs
        const configs = await loadConfigs();
        if (configs && Array.isArray(configs)) {
          setStore({ configs: configs as never[] }); // Type assertion needed for Zustand
        }

        // Load pads
        const pads = await loadPads();
        if (pads && typeof pads === 'object') {
          const padsData = pads as {
            padColours?: Record<string, Record<number, string>>;
            padLabels?: Record<string, string>;
            padChannels?: Record<string, number>;
            padActions?: Record<string, unknown>;
          };
          setStore((state) => ({
            padColours: padsData.padColours || state.padColours,
            padLabels: padsData.padLabels || state.padLabels,
            padChannels: padsData.padChannels || state.padChannels,
            padActions: padsData.padActions as never || state.padActions,
          }));
        }

        console.log('Loaded data from Tauri Store');
      } catch (error) {
        console.error('Failed to load data from Tauri Store:', error);
      }
    };

    loadData();
  }, [setStore]);
}

/**
 * Hook to persist settings to Tauri Store on changes
 */
export function usePersistSettings() {
  const settings = useStore((state) => state.settings);

  useEffect(() => {
    if (!isTauri()) return;

    const timeout = setTimeout(async () => {
      try {
        await saveSettings(settings);
      } catch (error) {
        console.error('Failed to persist settings:', error);
      }
    }, 500); // Debounce saves

    return () => clearTimeout(timeout);
  }, [settings]);
}

/**
 * Hook to persist macros to Tauri Store on changes
 */
export function usePersistMacros() {
  const macros = useStore((state) => state.macros);

  useEffect(() => {
    if (!isTauri()) return;

    const timeout = setTimeout(async () => {
      try {
        await saveMacros(macros);
      } catch (error) {
        console.error('Failed to persist macros:', error);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [macros]);
}

/**
 * Hook to persist configs to Tauri Store on changes
 */
export function usePersistConfigs() {
  const configs = useStore((state) => state.configs);

  useEffect(() => {
    if (!isTauri()) return;

    const timeout = setTimeout(async () => {
      try {
        await saveConfigs(configs);
      } catch (error) {
        console.error('Failed to persist configs:', error);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [configs]);
}

/**
 * Hook to persist pads to Tauri Store on changes
 */
export function usePersistPads() {
  const padColours = useStore((state) => state.padColours);
  const padLabels = useStore((state) => state.padLabels);
  const padChannels = useStore((state) => state.padChannels);
  const padActions = useStore((state) => state.padActions);

  useEffect(() => {
    if (!isTauri()) return;

    const timeout = setTimeout(async () => {
      try {
        await savePads({
          padColours,
          padLabels,
          padChannels,
          padActions,
        });
      } catch (error) {
        console.error('Failed to persist pads:', error);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [padColours, padLabels, padChannels, padActions]);
}

/**
 * Combined hook to manage all Tauri Store persistence
 */
export function useTauriPersistence() {
  useLoadTauriStore();
  usePersistSettings();
  usePersistMacros();
  usePersistConfigs();
  usePersistPads();
}
