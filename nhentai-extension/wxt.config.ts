import { defineConfig } from 'wxt'
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
    modules: ['@wxt-dev/module-vue', '@wxt-dev/auto-icons'],
    manifest: {
        name: 'nhentai-extension',
        permissions: ['offscreen'],
        host_permissions: ['*://*.nhentai.net/*'],
    },
    vite: () => ({
        plugins: [tailwindcss(), asciiOnlyPlugin()],
    }),
})
