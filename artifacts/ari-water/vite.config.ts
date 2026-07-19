import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawPort = env.PORT ?? process.env.PORT;
  const basePath = env.BASE_PATH ?? process.env.BASE_PATH ?? '/';
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8080';

  const port = Number(rawPort ?? 18090);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort ?? 18090}"`);
  }

  const plugins = [react(), tailwindcss(), runtimeErrorOverlay()];

  if (process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined) {
    const [cartographerPlugin, devBannerPlugin] = await Promise.all([
      import('@replit/vite-plugin-cartographer').then((m) =>
        m.cartographer({
          root: path.resolve(import.meta.dirname, '..'),
        }),
      ),
      import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
    ]);

    plugins.push(cartographerPlugin, devBannerPlugin);
  }

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
      // Optimize for production builds with limited memory
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react/jsx-runtime'],
            router: ['wouter'],
            query: ['@tanstack/react-query'],
          },
        },
      },
      // Reduce memory usage
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      sourcemap: false, // Disable sourcemaps in production to save memory
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
