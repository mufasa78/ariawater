import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawPort = env.PORT ?? process.env.PORT;
  const basePath = env.BASE_PATH ?? process.env.BASE_PATH ?? '/';
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8080';

  const port = Number(rawPort ?? 18090);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort ?? 18090}"`);
  }

  const plugins = [react(), tailwindcss()];

  return {
    base: basePath,
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
      // Aggressive optimization for low-memory environments
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split node_modules into smaller chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@tanstack')) {
                return 'query-vendor';
              }
              if (id.includes('lucide')) {
                return 'icons';
              }
              return 'vendor';
            }
          },
        },
      },
      // Reduce memory usage
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      sourcemap: false,
      // Reduce concurrent processing
      modulePreload: false,
      cssCodeSplit: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
