import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Get port from environment or use default 5173
const port = parseInt(process.env.PORT || "5173", 10);

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      // @ts-expect-error - electron-vite types are incomplete
      rollupOptions: {
        input: {
          main: resolve(__dirname, "electron/main.ts"),
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs",
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      // @ts-expect-error - electron-vite types are incomplete
      rollupOptions: {
        input: {
          preload: resolve(__dirname, "electron/preload.ts"),
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs",
        },
      },
    },
  },
  renderer: {
    root: ".",
    server: {
      port,
    },
    build: {
      // @ts-expect-error - electron-vite types are incomplete
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
