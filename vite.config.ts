import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { resolve } from 'node:path';

// Build the standalone demo into VitePress public assets without colliding
// with the /demo docs page route.
const base = process.env.VITE_BASE_PATH || './';

export default defineConfig(async ({ mode }) => {
  const plugins: Plugin[] = [];

  // Conditionally load visualizer only when analyze mode is active
  if (mode === 'analyze') {
    try {
      const { visualizer } = await import('rollup-plugin-visualizer');
      plugins.push(
        visualizer({
          open: true,
          filename: 'dist/stats.html',
        })
      );
    } catch {
      console.warn('⚠️  rollup-plugin-visualizer not installed, skipping bundle analysis');
      console.warn('   Run: npm install -D rollup-plugin-visualizer');
    }
  }

  if (mode === 'lib') {
    return {
      base,
      plugins,
      build: {
        target: 'esnext',
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          formats: ['es'],
          fileName: () => 'index.js',
        },
        rollupOptions: {
          output: {
            exports: 'named',
          },
        },
      },
    };
  }

  return {
    base,
    plugins,
    build: {
      target: 'esnext',
      outDir: 'docs/public/playground',
      emptyOutDir: true,
      rollupOptions: {
        plugins,
      },
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  };
});
