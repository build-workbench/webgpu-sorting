import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

const base = process.env.VITE_BASE_PATH || '/';

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

  return {
    base,
    build: {
      target: 'esnext',
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
