import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'build',
    sourcemap: true,
    minify: false,
    lib: {
      formats: ['es'],
      entry: 'src/main.ts',
      fileName: 'main',
    },
    rollupOptions: {
      plugins: [vanillaExtractPlugin({ identifiers: ({ hash }) => `bltx_${hash}` })],
      output: {
        preserveModules: true,
        assetFileNames({ name }) {
          return name?.replace(/^src\//, '') ?? '';
        },
      },
      external: (id) => {
        if (id.includes('/node_modules/')) return true;
        if (id.includes('/src/')) return false;
        if (id.startsWith('.')) return false;

        return true;
      },
    },
  },
});
