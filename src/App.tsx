import { useMidi } from './useMidi';
import LaunchpadCanvas from './LaunchpadCanvas';
import './App.css';

function App() {
  const { inputs, outputs } = useMidi();

  return (
    <div className="App">
      <p>
        Inputs: {inputs.length} Outputs: {outputs.length}
      </p>
      <LaunchpadCanvas />
    </div>
  );
}

export default App;
