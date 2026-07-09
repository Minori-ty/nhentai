import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    plugins: [vue(), tailwindcss(), dts({ insertTypesEntry: true })],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                router: resolve(__dirname, 'src/router.ts'),
            },
            name: 'NHentaiComponents',
            formats: ['es'],
        },
        rolldownOptions: {
            external: ['vue', 'vue-router', '@nhentai/api', '@nhentai/utils', 'date-fns', 'enum-plus', 'lodash-es'],
            output: {
                globals: {
                    vue: 'Vue',
                    'vue-router': 'VueRouter',
                },
            },
        },
        minify: true,
    },
})
