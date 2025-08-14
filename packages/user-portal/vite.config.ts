import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@foreman/shared': resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Set headers to match Foreman's expectations
            proxyReq.setHeader('Origin', 'http://localhost:3000');
            proxyReq.setHeader('Host', 'localhost:3000');
            proxyReq.setHeader('Referer', 'http://localhost:3000/');

            // Ensure proper CORS headers for authentication
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }

            // Log for debugging
            console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers to responses if needed
            proxyRes.headers['access-control-allow-origin'] = 'http://localhost:3001';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
          });
        },
      },
      '/notification_recipients': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Set headers to match Foreman's expectations
            proxyReq.setHeader('Origin', 'http://localhost:3000');
            proxyReq.setHeader('Host', 'localhost:3000');
            proxyReq.setHeader('Referer', 'http://localhost:3000/');

            // Ensure proper CORS headers for authentication
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }

            // Log for debugging
            console.log(`[Notifications Proxy] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers to responses if needed
            proxyRes.headers['access-control-allow-origin'] = 'http://localhost:3001';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: '../shared/src/test-setup.ts',
  },
  define: {
    'process.env': {},
  },
});