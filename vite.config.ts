import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          book: ["./src/game/pages.json", "./src/game/original-rules.json"],
          validation: ["zod"],
        },
      },
    },
  },
});
