
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // This tells Vite where to find index.html
  root: path.join(__dirname, 'src/renderer'),
  plugins: [react()],
  base: './',
  build: {
    outDir: path.resolve(__dirname, '.vite/renderer/main_window'),
  },
});
