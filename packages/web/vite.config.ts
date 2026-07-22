import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  base: process.env.INVOLUTE_BASE ?? "/Involute/", // GitHub Pages project path; override for a custom domain
  resolve: {
    alias: { "@involute/engine": fileURLToPath(new URL("../engine/src/index.ts", import.meta.url)) },
  },
});
