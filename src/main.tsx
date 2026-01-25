import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Debug: Check Tauri environment on load
console.log('[main.tsx] Environment check:', {
  hasTauriGlobal: '__TAURI__' in window,
  tauriVersion: (window as any).__TAURI__?.version,
  userAgent: navigator.userAgent
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
