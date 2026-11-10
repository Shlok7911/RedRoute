import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    // Prefer the TypeScript sources over any stale .js emit sitting beside them.
    extensions: [".mjs", ".mts", ".ts", ".tsx", ".jsx", ".js", ".json"],
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000"
    }
  }
});
