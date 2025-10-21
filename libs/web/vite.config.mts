import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'build',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      formats: ['es'],
      entry: 'src/main.ts',
      fileName: 'main',
    },
    rollupOptions: {
      plugins: [
        vanillaExtractPlugin({
          identifiers: ({ hash }) => `bltx_${hash}`,
          extract: {
            name: 'styles.css',
            sourcemap: true,
          },
        }),
      ],
      output: {
        preserveModules: true,
      },
      external: (id) => {
        if (id.includes('/node_modules/')) return true;
        if (id.includes('/src/')) return false;
        if (id.startsWith('.')) return false;
        if (id.includes('.css.ts.vanilla.css')) return false;

        return true;
      },
    },
  },
});
