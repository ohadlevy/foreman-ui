import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let backendUrl = 'http://localhost:3000';
  if (env.REACT_APP_API_URL) {
    try {
      backendUrl = new URL(env.REACT_APP_API_URL).origin;
    } catch (error) {
      console.warn('Invalid REACT_APP_API_URL format, falling back to localhost:3000:', error);
    }
  }

  return {
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Set headers to match Foreman's expectations
            proxyReq.setHeader('Origin', backendUrl);
            proxyReq.setHeader('Host', new URL(backendUrl).host);
            proxyReq.setHeader('Referer', backendUrl + '/');
           
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
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Set headers to match Foreman's expectations
            proxyReq.setHeader('Origin', backendUrl);
            proxyReq.setHeader('Host', new URL(backendUrl).host);
            proxyReq.setHeader('Referer', backendUrl + '/');

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
  };
});
