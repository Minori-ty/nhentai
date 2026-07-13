import { getMe } from '@nhentai/api'
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
    runAt: 'document_start',
    excludeMatches: Array.from({ length: 4 }, (_, i) => `https://i${i + 1}.nhentai.net/*`),
    async main() {
        // CDN 预连接
        // preconnectImageCDNs()
        console.log('Content script loaded on nhentai.net', document.body)
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
        // 通过 API 获取当前用户信息
        try {
            const me = await getMe()
            setUserAvatar(`https://i2.nhentai.net/${me.avatar_url}`)
            setUserName(me.username)
        } catch {
            // 未登录或接口失败，不设置头像/用户名
        }
    },
})
