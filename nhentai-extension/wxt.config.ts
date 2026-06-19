import { defineConfig } from 'wxt'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

function asciiOnlyPlugin(): Plugin {
    return {
        name: 'ascii-only',
        enforce: 'post',
        generateBundle(_, bundle) {
            for (const chunk of Object.values(bundle)) {
                if (chunk.type !== 'chunk') continue

                chunk.code = [...chunk.code]
                    .map((char) => {
                        const code = char.codePointAt(0)!

                        return code > 0x7f ? `\\u{${code.toString(16)}}` : char
                    })
                    .join('')
            }
        },
    }
}

export default defineConfig({
    modules: ['@wxt-dev/module-vue'],
    manifest: {
        name: 'nhentai-extension',
        permissions: ['offscreen'],
        host_permissions: ['*://*.nhentai.net/*'],
        icons: {
            '16': 'icon/16.png',
            '32': 'icon/32.png',
            '48': 'icon/48.png',
            '128': 'icon/128.png',
        },
        action: {
            default_icon: {
                '16': 'icon/16.png',
                '32': 'icon/32.png',
            },
        },
    },
    vite: () => ({
        resolve: {
            alias: {
                '@nhentai/shared': resolve(__dirname, '../packages/shared/src'),
            },
        },
        plugins: [tailwindcss(), asciiOnlyPlugin()],
    }),
})
