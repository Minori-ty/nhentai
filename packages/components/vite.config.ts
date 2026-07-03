import { resolve } from 'path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { dtsPlugin } from '../../vite.lib'

export default defineConfig({
    plugins: [vue(), tailwindcss(), dtsPlugin],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                router: resolve(__dirname, 'src/router.ts'),
            },
            name: 'NHentaiComponents',
            formats: ['es'],
        },
        rollupOptions: {
            external: ['vue', 'vue-router', '@nhentai/api', '@nhentai/utils', 'date-fns', 'enum-plus'],
            output: {
                globals: {
                    vue: 'Vue',
                    'vue-router': 'VueRouter',
                },
            },
        },
    },
})
