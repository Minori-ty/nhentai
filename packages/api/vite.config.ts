import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    plugins: [dts({ insertTypesEntry: true })],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'NHentaiAPI',
            fileName: 'index',
            formats: ['es'],
        },
        rolldownOptions: {
            external: ['enum-plus'],
        },
        minify: true,
    },
})
