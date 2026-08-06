// Build config for the self-contained, single-file browser demo.
// Redirects the Supabase data layer to the in-memory demo modules and inlines
// all JS/CSS into one HTML file (dist-demo/demo.html).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

function demoDataSource() {
  return {
    name: 'demo-data-source',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (source.endsWith('/lib/products')) return resolve(here, 'src/demo/products.ts');
      if (source.endsWith('/lib/customerNeeds')) return resolve(here, 'src/demo/customerNeeds.ts');
      return null;
    },
  };
}

export default defineConfig({
  plugins: [demoDataSource(), react(), viteSingleFile()],
  build: {
    outDir: 'dist-demo',
    rollupOptions: { input: resolve(here, 'demo.html') },
  },
});
