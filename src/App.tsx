import LaunchpadCanvas from './LaunchpadCanvas';
import LaunchpadControls from './LaunchpadControls';
import MacroList from './MacroList';
import MacroBuilder from './MacroBuilder';
import SysexWorkbench from './SysexWorkbench';
import MidiDevices from './MidiDevices';
import MidiLogger from './MidiLogger';
import ActionBar from './ActionBar';
import ConfigManager from './ConfigManager';
import ToastContainer from './ToastContainer';
import TitleBar from './TitleBar';
import Tabs from './Tabs';
import SettingsModal from './SettingsModal';
import { usePadActions } from './usePadActions';
import { useStore } from './store';
import { useEffect } from 'react';
import { useMidi } from './useMidi';
import { setSleepMode } from './midiMessages';
import { isTauri } from './tauriApi';
import { useLogStore } from './logStore';
import './App.css';

function App() {
  usePadActions();
  const autoSleep = useStore((s) => s.settings.autoSleep);
  const theme = useStore((s) => s.settings.theme);
  const pingEnabled = useStore((s) => s.settings.pingEnabled);
  const selectedInput = useStore((s) => s.devices.inputId);
  const selectedOutput = useStore((s) => s.devices.outputId);
  const { send, status, pingDelay, inputs, outputs } = useMidi();
  const logs = useLogStore((s) => s.logs);

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
      <TitleBar />
      <div className="app-content">
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
                  <div className="retro-panel">
                    <h3>◄ System Diagnostics ►</h3>
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <div style={{ padding: '12px', background: 'var(--input-bg)', border: '2px solid var(--panel-border)', borderRadius: '4px', marginBottom: '12px' }}>
                          <h5 style={{ color: 'var(--highlight)', marginTop: 0 }}>CONNECTION</h5>
                          <div style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
                            <div><strong>Status:</strong> <span className={`connection-status ${status}`} style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.85rem' }}>{status.toUpperCase()}</span></div>
                            <div><strong>Ping:</strong> {pingEnabled ? (pingDelay !== null ? `${pingDelay}ms` : '---') : 'Disabled'}</div>
                            <div><strong>Mode:</strong> {isTauri() ? 'Tauri IPC' : 'WebSocket'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div style={{ padding: '12px', background: 'var(--input-bg)', border: '2px solid var(--panel-border)', borderRadius: '4px', marginBottom: '12px' }}>
                          <h5 style={{ color: 'var(--highlight)', marginTop: 0 }}>DEVICES</h5>
                          <div style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
                            <div><strong>Inputs:</strong> {inputs.length}</div>
                            <div><strong>Outputs:</strong> {outputs.length}</div>
                            <div><strong>Selected In:</strong> {inputs.find(i => i.id === selectedInput)?.name || 'None'}</div>
                            <div><strong>Selected Out:</strong> {outputs.find(o => o.id === selectedOutput)?.name || 'None'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div style={{ padding: '12px', background: 'var(--input-bg)', border: '2px solid var(--panel-border)', borderRadius: '4px', marginBottom: '12px' }}>
                          <h5 style={{ color: 'var(--highlight)', marginTop: 0 }}>LOGS</h5>
                          <div style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
                            <div><strong>Total:</strong> {logs.length}</div>
                            <div><strong>Incoming:</strong> {logs.filter(l => l.direction === 'in').length}</div>
                            <div><strong>Outgoing:</strong> {logs.filter(l => l.direction === 'out').length}</div>
                            <div><strong>Theme:</strong> {theme}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              <div className="row">
                <div className="col-12">
                  <div className="retro-panel">
                    <h3>◄ Settings ►</h3>
                    <SettingsModal />
                  </div>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
