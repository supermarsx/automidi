import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), VitePWA()],
});
