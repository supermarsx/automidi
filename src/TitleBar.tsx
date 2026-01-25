import { minimizeWindow, toggleMaximize, closeWindow } from './tauriWindow';
import './TitleBar.css';

export default function TitleBar() {
  const handleMinimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[TitleBar] Minimize clicked');
    try {
      await minimizeWindow();
      console.log('[TitleBar] Minimize successful');
    } catch (error) {
      console.error('[TitleBar] Failed to minimize window:', error);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[TitleBar] Maximize clicked');
    try {
      await toggleMaximize();
      console.log('[TitleBar] Maximize successful');
    } catch (error) {
      console.error('[TitleBar] Failed to maximize window:', error);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[TitleBar] Close clicked');
    try {
      await closeWindow();
      console.log('[TitleBar] Close successful');
    } catch (error) {
      console.error('[TitleBar] Failed to close window:', error);
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
