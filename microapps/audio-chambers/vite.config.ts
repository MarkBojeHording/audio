import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'audioChambers',
      filename: 'remoteEntry.js',
      exposes: {
        './AudioChambers': './src/AudioChambers.tsx'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'lucide-react': { singleton: true }
      }
    })
  ],
  server: {
    port: 5003,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
});