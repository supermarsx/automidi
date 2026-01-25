import './TitleBar.css';

export default function TitleBar() {
  const handleMinimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[TitleBar] Minimize button clicked');
    
    try {
      // Dynamic import for Tauri v2 API
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      console.log('[TitleBar] Tauri API imported');
      
      const appWindow = getCurrentWindow();
      console.log('[TitleBar] Window object obtained');
      
      await appWindow.minimize();
      console.log('[TitleBar] Window minimized successfully');
    } catch (err) {
      console.error('[TitleBar] Minimize failed:', err);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[TitleBar] Maximize button clicked');
    
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      console.log('[TitleBar] Tauri API imported');
      
      const appWindow = getCurrentWindow();
      console.log('[TitleBar] Window object obtained');
      
      await appWindow.toggleMaximize();
      console.log('[TitleBar] Window toggle maximize successfully');
    } catch (err) {
      console.error('[TitleBar] Maximize failed:', err);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[TitleBar] Close button clicked');
    
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      console.log('[TitleBar] Tauri API imported');
      
      const appWindow = getCurrentWindow();
      console.log('[TitleBar] Window object obtained');
      
      await appWindow.close();
      console.log('[TitleBar] Window closed successfully');
    } catch (err) {
      console.error('[TitleBar] Close failed:', err);
    }
  };

  return (
    <div className="titlebar">
      <div className="titlebar-title">
        <span className="titlebar-logo">◄ AutoMIDI v2.0 ►</span>
      </div>
      <div className="titlebar-controls">
        <button type="button" className="titlebar-button minimize" onClick={handleMinimize}>
          −
        </button>
        <button type="button" className="titlebar-button maximize" onClick={handleMaximize}>
          □
        </button>
        <button type="button" className="titlebar-button close" onClick={handleClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
