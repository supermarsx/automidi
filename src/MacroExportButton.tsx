import { useStore } from './store';

export default function MacroExportButton() {
  const handleExport = () => {
    const macros = useStore.getState().macros;
    const data = JSON.stringify(macros);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'macros.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="retro-button btn-sm me-1" onClick={handleExport}>
      EXPORT
    </button>
  );
}
