import { App } from '@nhentai/components'
import { setUserAvatar, setUserName, DownloadManagerKey } from '@nhentai/components'
import router from '@nhentai/components/router'
import { preconnectImageCDNs } from '@nhentai/utils'
import { createApp } from 'vue'

import { createDownloadManager } from '@/utils/downloadManager'

import '../assets/tailwind.css'

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
        app.provide(DownloadManagerKey, createDownloadManager())
        app.mount('#app')
    },
})
