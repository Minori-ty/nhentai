import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import monkey, { cdn } from 'vite-plugin-monkey'

const logoSvg = readFileSync(resolve(__dirname, './assets/logo.svg'), 'utf-8')
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`

export default defineConfig({
    resolve: {
        alias: {
            '@nhentai/shared': resolve(__dirname, '../packages/shared/src'),
            '@': resolve(__dirname, '../packages/shared/src'),
        },
    },
    plugins: [
        vue(),
        tailwindcss(),
        monkey({
            entry: 'src/main.ts',
            userscript: {
                icon: logoDataUri,
                namespace: 'nhentai-tampermonkey',
                name: 'nhentai-tampermonkey',
                description: 'Enhanced mobile-friendly UI for nhentai.net',
                match: ['*://*.nhentai.net/*'],
                exclude: ['*://i*.nhentai.net/*'],
            },
            build: {
                externalGlobals: {
                    vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
                    'vue-router': cdn.jsdelivr('VueRouter', 'dist/vue-router.global.prod.js'),
                },
            },
        }),
    ],
})
