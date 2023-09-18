const path = require('path')
import { resolve } from 'path'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import vue from '@vitejs/plugin-vue'

const alias: Record<string, string> = {
  '@': resolve(__dirname, ".", "src")
}

module.exports = defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: 'Icon'
        })
      ]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    Icons({
      autoInstall: true
    })
  ],
  resolve:{
    alias:{
      "@": path.resolve("./src")
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'spacegate-admin',
      formats: ['es'],
      fileName: (format) => `spacegate-admin.${format}.js`
    },
    rollupOptions: {
      external: ['vue', /element-plus\/.+/],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
      }
    },
    emptyOutDir: false
  }
})
