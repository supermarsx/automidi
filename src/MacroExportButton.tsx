import { useStore } from './store';
import { isTauri, saveFile, writeTextFile } from './tauriApi';
import { useToastStore } from './toastStore';

export default function MacroExportButton() {
  const addToast = useToastStore((s) => s.addToast);

  const handleExport = async () => {
    const macros = useStore.getState().macros;
    const data = JSON.stringify(macros, null, 2);

    if (isTauri()) {
      // Use Tauri file dialog
      try {
        const filePath = await saveFile({
          title: 'Export Macros',
          filters: [{ name: 'JSON', extensions: ['json'] }],
          defaultPath: 'macros.json',
        });

        if (filePath) {
          const success = await writeTextFile(filePath, data);
          if (success) {
            addToast('Macros exported successfully', 'success');
          } else {
            addToast('Failed to write file', 'error');
          }
        }
      } catch (error) {
        addToast(`Export failed: ${error}`, 'error');
      }
    } else {
      // Use browser download
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'macros.json';
      a.click();
      URL.revokeObjectURL(url);
      addToast('Macros exported', 'success');
    }
  };

  return (
    <button className="retro-button btn-sm me-1" onClick={handleExport}>
      EXPORT
    </button>
  );
}
