import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // silence proxy connection errors (backend not running) to avoid noisy logs
        configure: (proxy: any) => {
          proxy.on('error', (_err: any, _req: any, res: any) => {
            try {
              if (res && !res.headersSent) {
                // end the response silently
                res.writeHead && res.writeHead(502);
              }
              res && res.end && res.end();
            } catch (_) {
              // ignore
            }
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
