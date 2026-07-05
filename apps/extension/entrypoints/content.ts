import { App } from '@nhentai/components'
import { setUserAvatar, setUserName, DownloadManagerKey, OpenInNewTabKey } from '@nhentai/components'
import router from '@nhentai/components/router'
import { preconnectImageCDNs } from '@nhentai/utils'
import { createApp } from 'vue'

import { createDownloadManager } from '@/utils/downloadManager'

import '../tailwind.css'
import '@nhentai/components/components.css'

export default defineContentScript({
    matches: ['https://nhentai.net/*'],
    excludeMatches: Array.from({ length: 4 }, (_, i) => `https://i${i + 1}.nhentai.net/*`),
    main() {
        // 在清除之前获取头像 URL
        const avatarImg = document.querySelector<HTMLImageElement>(
            '#app > nav > div > ul.menu.right > li:nth-child(2) > a > img',
        )
        if (avatarImg) {
            setUserAvatar(avatarImg.src)
        }

        const nameEl = document.querySelector<HTMLElement>(
            '#app > nav > div > ul.menu.right > li:nth-child(2) > a > span',
        )
        if (nameEl) {
            setUserName(nameEl.innerText.trim())
        }

        // CDN 预连接
        preconnectImageCDNs()

        // 把 nhentai.net 的 CSS 全部包进 @layer nhentai（最低优先级）
        // 这样 Tailwind v4 的 @layer utilities 就能生效
        document.querySelectorAll('style').forEach((el) => {
            if (!el.textContent?.includes('@layer')) {
                el.textContent = `@layer nhentai { ${el.textContent} }`
            }
        })
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((el) => {
            const href = el.href
            if (href) {
                const style = document.createElement('style')
                style.textContent = `@layer nhentai { @import url("${href}"); }`
                el.replaceWith(style)
            }
        })

        // 清除 body 内容
        document.body.innerHTML = ''
        document.body.style.backgroundColor = '#202a34'

        // 创建挂载点
        const root = document.createElement('div')
        root.className = 'bg-[#202a34] min-h-screen'
        root.id = 'app'
        document.body.appendChild(root)

        // 挂载 Vue 应用
        const app = createApp(App)
        app.use(router)
        app.provide(OpenInNewTabKey, true)
        app.provide(DownloadManagerKey, createDownloadManager())
        app.mount('#app')
    },
})
