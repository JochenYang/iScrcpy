import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: 'electron/main.ts',
      formats: ['cjs'],
      fileName: 'main',
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        globals: {
          electron: 'require("electron")',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env': '{}',
  },
  ssr: {
    noExternal: ['path', 'child_process', 'fs', 'os'],
  },
})
