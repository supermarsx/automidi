import { useStore } from './store';
import { saveJsonFile } from './tauriFiles';

export default function MacroExportButton() {
  const handleExport = () => {
    const macros = useStore.getState().macros;
    saveJsonFile('macros.json', macros);
  };

  return (
    <button className="retro-button btn-sm me-1" onClick={handleExport}>
      EXPORT
    </button>
  );
}
