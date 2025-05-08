import { defineConfig } from "vite";

import "dotenv/config";

const base = process.env.VITE_HYPHA_SERVER_URL?.includes("https")
  ? "/"
  : "/app/";

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [],
});
