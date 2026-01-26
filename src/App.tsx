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
              { id: 'mission', label: 'Mission Control', icon: '🚀' },
              { id: 'diagnostics', label: 'Diagnostics', icon: '📊' },
              { id: 'macros', label: 'Macros', icon: '🎹' },
              { id: 'config', label: 'Config', icon: '⚙️' },
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
                        <div className="diagnostics-card">
                          <h5 className="diagnostics-header">CONNECTION</h5>
                          <table className="diagnostics-table">
                            <tbody>
                              <tr>
                                <td className="diagnostics-label">Status:</td>
                                <td><span className={`connection-status ${status}`}>{status.toUpperCase()}</span></td>
                              </tr>
                              <tr>
                                <td className="diagnostics-label">Ping:</td>
                                <td className="diagnostics-value">{pingEnabled ? (pingDelay !== null ? `${pingDelay}ms` : '---') : 'Disabled'}</td>
                              </tr>
                              <tr>
                                <td className="diagnostics-label">Mode:</td>
                                <td className="diagnostics-value">{isTauri() ? 'Tauri IPC' : 'WebSocket'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="diagnostics-card">
                          <h5 className="diagnostics-header">DEVICES</h5>
                          <table className="diagnostics-table">
                            <tbody>
                              <tr>
                                <td className="diagnostics-label">Inputs:</td>
                                <td className="diagnostics-value">{inputs.length}</td>
                              </tr>
                              <tr>
                                <td className="diagnostics-label">Outputs:</td>
                                <td className="diagnostics-value">{outputs.length}</td>
                              </tr>
                              <tr>
                                <td className="diagnostics-label">Selected In:</td>
                                <td className="diagnostics-value">{inputs.find(i => i.id === selectedInput)?.name || 'None'}</td>
                              </tr>
                              <tr>
                                <td className="diagnostics-label">Selected Out:</td>
                                <td className="diagnostics-value">{outputs.find(o => o.id === selectedOutput)?.name || 'None'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="diagnostics-card">
                          <h5 className="diagnostics-header">LOGS</h5>
                          <table className="diagnostics-table">
                            <tbody>
                              <tr>
                                <td className="diagnostics-label">Total:</td>
                                <td className="diagnostics-value">{logs.length}</td>
                              </tr>
                              <tr>
                                <td className="diagnostics-label">Incoming:</td>
                                <td className="diagnostics-value">{logs.filter(l => l.direction === 'in').length}</td>
                              </tr>
                              <tr>
                                <td className="diagnostics-label">Outgoing:</td>
                                <td className="diagnostics-value">{logs.filter(l => l.direction === 'out').length}</td>
                              </tr>
                              <tr>
                                <td className="diagnostics-label">Theme:</td>
                                <td className="diagnostics-value">{theme}</td>
                              </tr>
                            </tbody>
                          </table>
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
