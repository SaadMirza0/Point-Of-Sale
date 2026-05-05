// import { defineConfig } from 'vite';

// // https://vitejs.dev/config
// export default defineConfig({});


import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Change this from 'src/main.js' to:
    lib: {
      entry: 'src/main/index.js', 
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron', 'sqlite3'], // Keep these external
    },
  },
});
