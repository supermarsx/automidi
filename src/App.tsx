import LaunchpadCanvas from './LaunchpadCanvas';
import LaunchpadControls from './LaunchpadControls';
import MacroList from './MacroList';
import SysexWorkbench from './SysexWorkbench';
import MidiDevices from './MidiDevices';
import ActionBar from './ActionBar';
import FloatingActionBar from './FloatingActionBar';
import ConfigManager from './ConfigManager';
import './App.css';

function App() {
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
              <LaunchpadControls />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <MacroList />
            </div>
            <div className="col-md-6">
              <SysexWorkbench />
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <ConfigManager />
            </div>
          </div>
        </div>
      </div>
      <FloatingActionBar />
    </div>
  );
}

export default App;
