// import { defineConfig } from 'vite';

// // https://vitejs.dev/config
// export default defineConfig({});

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/index.js',
      fileName: 'main',
      formats: ['cjs'],
    },
    rollupOptions: {

      external: [
        'electron',
        'sqlite3',
        'pg',
        '@electron-forge/plugin-fuses',
      ],
    },
    outDir: '.vite/build',
    emptyOutDir: true,
  },
});
