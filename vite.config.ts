import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function lovableTaggerWithWindowsPathFix() {
  const tagger = componentTagger();

  // Normalize injected attribute values to posix paths.
  const normalizeInjectedPaths = (input: string) => {
    const normalizeAttr = (attrName: string, code: string) =>
      code.replace(
        new RegExp(`${attrName}="([^"]*)"`, "g"),
        (match, value: string) => match.replace(value, value.replaceAll("\\\\", "/"))
      );

    let next = input;
    next = normalizeAttr("data-component-path", next);
    next = normalizeAttr("data-lov-id", next);
    return next;
  };

  return {
    // Run before react-swc so SWC never sees invalid escape sequences.
    name: "lovable-tagger-with-windows-path-fix",
    enforce: "pre" as const,

    // Preserve other lovable-tagger behavior (server hooks etc).
    buildStart: tagger.buildStart?.bind(tagger),
    configureServer: tagger.configureServer?.bind(tagger),

    async transform(code: string, id: string) {
      if (!/\.(t|j)sx$/.test(id)) return null;

      const transformed = await tagger.transform?.call(this, code, id);
      if (!transformed) return null;

      const nextCode = typeof transformed === "string" ? transformed : transformed.code;
      const fixed = normalizeInjectedPaths(nextCode);

      if (typeof transformed === "string") {
        return fixed === transformed ? null : fixed;
      }

      return fixed === transformed.code ? null : { ...transformed, code: fixed, map: transformed.map ?? null };
    },
  };
}

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
    mode === "development" && lovableTaggerWithWindowsPathFix(),
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
