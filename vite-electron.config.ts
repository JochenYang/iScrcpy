import { defineConfig } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      // @ts-ignore
      lib: {
        entry: resolve(__dirname, 'electron/main.ts'),
        formats: ['cjs'],
        fileName: 'main'
      },
      // @ts-ignore
      rollupOptions: {
        external: ['electron'],
        output: {
          globals: {
            electron: 'require("electron")'
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    define: {
      'process.env': '{}'
    },
    ssr: {
      noExternal: ['path', 'child_process', 'fs', 'os']
    }
  },
  preload: {
    build: {
      // @ts-ignore
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts'),
        formats: ['cjs'],
        fileName: 'preload'
      },
      // @ts-ignore
      rollupOptions: {
        external: ['electron'],
        output: {
          globals: {
            electron: 'require("electron")'
          }
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  }
})
