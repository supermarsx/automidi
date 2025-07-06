import LaunchpadCanvas from './LaunchpadCanvas';
import MacroList from './MacroList';
import SysexWorkbench from './SysexWorkbench';
import MidiDevices from './MidiDevices';
import './App.css';

function App() {
  return (
    <div className="App">
      <MidiDevices />
      <LaunchpadCanvas />
      <MacroList />
      <SysexWorkbench />
    </div>
  );
}

export default App;
