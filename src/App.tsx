import LaunchpadCanvas from './LaunchpadCanvas';
import MacroList from './MacroList';
import SysexWorkbench from './SysexWorkbench';
import MidiDevices from './MidiDevices';
import ActionBar from './ActionBar';
import './App.css';

function App() {
  return (
    <div className="App">
      <ActionBar />
      <MidiDevices />
      <LaunchpadCanvas />
      <MacroList />
      <SysexWorkbench />
    </div>
  );
}

export default App;
