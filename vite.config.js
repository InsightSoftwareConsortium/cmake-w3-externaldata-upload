import { defineConfig } from "vite";

import "dotenv/config";

const base = process.env.BASE_DIR || "/app/";

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [],
});
