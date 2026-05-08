// import { defineConfig } from 'vite';

// // https://vitejs.dev/config
// export default defineConfig({});

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      // FIX: Added /index to the path
      entry: 'src/preload/index.js', 
      fileName: () => 'index.js',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron'],
    },
  },
});
