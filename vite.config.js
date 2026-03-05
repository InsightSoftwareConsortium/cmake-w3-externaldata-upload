import { defineConfig } from "vite";

const base = process.env.BASE_DIR || "/";

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [],
  server: {
    proxy: {
      // Proxy API and auth requests to the Cloudflare Worker (wrangler dev)
      "/auth": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
