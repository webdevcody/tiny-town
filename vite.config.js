import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page app: gallery, viewer, town view and the page used by `npm run shots`.
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        view: resolve(import.meta.dirname, 'view.html'),
        town: resolve(import.meta.dirname, 'town.html'),
        shots: resolve(import.meta.dirname, 'shots.html'),
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'three/addons/controls/OrbitControls.js', 'three/addons/environments/RoomEnvironment.js'],
  },
});
