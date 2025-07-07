import LaunchpadCanvas from './LaunchpadCanvas';
import LaunchpadControls from './LaunchpadControls';
import MacroList from './MacroList';
import MacroBuilder from './MacroBuilder';
import SysexWorkbench from './SysexWorkbench';
import MidiDevices from './MidiDevices';
import ActionBar from './ActionBar';
import FloatingActionBar from './FloatingActionBar';
import ConfigManager from './ConfigManager';
import ToastContainer from './ToastContainer';
import { usePadActions } from './usePadActions';
import { useStore } from './store';
import { useEffect } from 'react';
import { useMidi } from './useMidi';
import { setSleepMode } from './midiMessages';
import './App.css';

function App() {
  usePadActions();
  const autoSleep = useStore((s) => s.settings.autoSleep);
  const theme = useStore((s) => s.settings.theme);
  const { send } = useMidi();

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
      <div className="scan-lines"></div>
      <div className="container-fluid">
        <div className="retro-container">
          <h1 className="retro-title">◄ AutoMIDI v2.0 ►</h1>
          <ActionBar />
          <div className="row">
            <div className="col-md-6">
              <MidiDevices />
            </div>
            <div className="col-md-6">
              <div className="retro-panel">
                <h3>◄ Launchpad Mission Control ►</h3>
                <LaunchpadCanvas />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <ConfigManager />
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <LaunchpadControls />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <MacroList />
              <MacroBuilder />
            </div>
            <div className="col-md-6">
              <SysexWorkbench />
            </div>
          </div>
        </div>
      </div>
      <FloatingActionBar />
      <ToastContainer />
    </div>
  );
}

export default App;
