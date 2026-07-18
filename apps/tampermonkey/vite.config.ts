import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import monkey, { cdn } from 'vite-plugin-monkey'

import pkg from './package.json' with { type: 'json' }

const logoSvg = readFileSync(resolve(__dirname, './assets/logo.svg'), 'utf-8')
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    whitespace: 'condense', // 压缩模板空白，减少编译量
                },
            },
        }),
        tailwindcss(),
        monkey({
            entry: 'src/main.ts',
            userscript: {
                icon: logoDataUri,
                namespace: 'nhentai',
                name: 'nhentai Enhanced',
                description: 'Enhanced mobile-friendly UI for nhentai.net',
                match: ['https://nhentai.net/*'],
                exclude: ['*://i*.nhentai.net/*', 'https://nhentai.net/login', 'https://nhentai.net/api/v2/docs/*'],
                version: pkg.version,
            },
            build: {
                externalGlobals: {
                    vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
                    'vue-router': cdn.jsdelivr('VueRouter', 'dist/vue-router.global.prod.js'),
                    // date-fns v4 CDN files moved to @date-fns/cdn
                    'date-fns': [
                        'dateFns',
                        (version: string) => `https://cdn.jsdelivr.net/npm/@date-fns/cdn@${version}/cdn.min.js`,
                    ],
                },
            },
        }),
    ],
})
