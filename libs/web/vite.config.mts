import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vanillaExtractPlugin({ identifiers: ({ hash }) => `bltx_${hash}` })],
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
      external: (id) => {
        if (id.includes('/node_modules/')) return true;
        if (id.includes('/src/')) return false;
        if (id.startsWith('.')) return false;

        return true;
      },
    },
  },
});
