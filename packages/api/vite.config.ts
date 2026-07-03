import { resolve } from 'path'

import { defineConfig } from 'vite'

import { dtsPlugin } from '../../vite.lib'

export default defineConfig({
    plugins: [dtsPlugin],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'NHentaiAPI',
            fileName: 'index',
            formats: ['es'],
        },
        rollupOptions: {
            external: ['enum-plus'],
        },
    },
})
