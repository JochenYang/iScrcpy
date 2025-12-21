import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  main: {
    build: {
      // @ts-ignore - electron-vite types are incomplete
      lib: {
        entry: resolve(__dirname, "electron/main.ts"),
        formats: ["cjs"],
      },
    },
  },
  preload: {
    build: {
      // @ts-ignore - electron-vite types are incomplete
      lib: {
        entry: resolve(__dirname, "electron/preload.ts"),
        formats: ["cjs"],
      },
    },
  },
  renderer: {
    root: ".",
    build: {
      // @ts-ignore - electron-vite types are incomplete
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  },
});
