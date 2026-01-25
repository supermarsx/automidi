import LaunchpadCanvas from './LaunchpadCanvas';
import LaunchpadControls from './LaunchpadControls';
import MacroList from './MacroList';
import MacroBuilder from './MacroBuilder';
import SysexWorkbench from './SysexWorkbench';
import MidiDevices from './MidiDevices';
import MidiLogger from './MidiLogger';
import ActionBar from './ActionBar';
import FloatingActionBar from './FloatingActionBar';
import ConfigManager from './ConfigManager';
import ToastContainer from './ToastContainer';
import TitleBar from './TitleBar';
import Tabs from './Tabs';
import { usePadActions } from './usePadActions';
import { useStore } from './store';
import { useEffect } from 'react';
import { useMidi } from './useMidi';
import { setSleepMode } from './midiMessages';
import { useTauriPersistence } from './useTauriPersistence';
import { performMigrationWorkflow } from './tauriMigration';
import { isTauri } from './tauri';
import './App.css';

function App() {
  usePadActions();
  useTauriPersistence(); // Enable Tauri Store persistence
  const autoSleep = useStore((s) => s.settings.autoSleep);
  const theme = useStore((s) => s.settings.theme);
  const { send } = useMidi();

  // Check for migration on first load (Tauri mode only)
  useEffect(() => {
    if (isTauri()) {
      performMigrationWorkflow().catch(console.error);
    }
  }, []);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  useEffect(() => {
    if (autoSleep <= 0) return;
    let t: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        send(setSleepMode(true));
      }, autoSleep * 1000);
    };
    reset();
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [autoSleep, send]);
  return (
    <div className="App">
      {isTauri() && <TitleBar />}
      <div className="scan-lines"></div>
      <div className="container-fluid">
        <div className="retro-container">
          <ActionBar />
          <Tabs
            tabs={[
              { id: 'mission', label: 'Mission Control', icon: '◄►' },
              { id: 'diagnostics', label: 'Diagnostics', icon: '⚡' },
              { id: 'macros', label: 'Macros', icon: '⚙' },
              { id: 'config', label: 'Config', icon: '⚙' },
            ]}
          >
            {/* Mission Control Tab */}
            <div>
              <div className="row">
                <div className="col-md-6">
                  <MidiDevices />
                </div>
                <div className="col-md-6">
                  <div className="retro-panel">
                    <h3>◄ Launchpad Control ►</h3>
                    <LaunchpadCanvas />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <LaunchpadControls />
                </div>
              </div>
            </div>

            {/* Diagnostics Tab */}
            <div>
              <div className="row">
                <div className="col-12">
                  <MidiLogger />
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <SysexWorkbench />
                </div>
              </div>
            </div>

            {/* Macros Tab */}
            <div>
              <div className="row">
                <div className="col-md-6">
                  <MacroList />
                </div>
                <div className="col-md-6">
                  <MacroBuilder />
                </div>
              </div>
            </div>

            {/* Config Tab */}
            <div>
              <div className="row">
                <div className="col-12">
                  <ConfigManager />
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
      <FloatingActionBar />
      <ToastContainer />
    </div>
  );
}

export default App;
