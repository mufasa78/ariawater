import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawPort = env.PORT ?? process.env.PORT;
  const basePath = env.BASE_PATH ?? process.env.BASE_PATH ?? '/';

  const port = Number(rawPort ?? 3000);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort ?? 3000}"`);
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
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
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
