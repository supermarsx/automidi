import { useMidi } from './useMidi';
import LaunchpadCanvas from './LaunchpadCanvas';
import MacroList from './MacroList';
import './App.css';
import SysexWorkbench from './SysexWorkbench';

function App() {
  const { inputs, outputs } = useMidi();

  return (
    <div className="App">
      <p>
        Inputs: {inputs.length} Outputs: {outputs.length}
      </p>
      <LaunchpadCanvas />
      <MacroList />
      <SysexWorkbench />
    </div>
  );
}

export default App;
