import { getMe } from '@nhentai/api'
import { preconnectImageCDNs } from '@nhentai/utils'
import { createApp } from 'vue'

import { setUserAvatar, setUserName } from '@/composables/useUserAvatar'

import App from '../App.vue'
import router from '../router'

import '../tailwind.css'

export default defineContentScript({
    matches: ['https://nhentai.net/*'],
    runAt: 'document_start',
    excludeMatches: [
        ...Array.from({ length: 4 }, (_, i) => `https://i${i + 1}.nhentai.net/*`),
        'https://nhentai.net/api/v2/docs/*',
    ],
    async main() {
        // 获取用户信息
        getMe().then((me) => {
            setUserAvatar(`https://i1.nhentai.net/${me.avatar_url}`)
            setUserName(me.username)
        })
        // 创建挂载点
        const root = document.createElement('div')
        root.className = 'bg-[#202a34] min-h-screen'
        root.id = 'app'
        let removed = false
        const bodyObs = new MutationObserver((list) => {
            list.forEach((m) => {
                m.addedNodes.forEach((node) => {
                    if (node instanceof HTMLHeadElement) {
                        // CDN 预连接
                        preconnectImageCDNs()
                    }

                    if (node instanceof HTMLBodyElement && !removed) {
                        console.log('Content script loaded on nhentai.net', node)
                        // 清除 body 内容
                        node.remove()
                        removed = true
                        const body = document.createElement('body')
                        document.documentElement.appendChild(body)
                        document.body.style.backgroundColor = '#202a34'
                        document.body.appendChild(root)

                        // 挂载 Vue 应用
                        const app = createApp(App)
                        app.use(router)
                        app.mount('#app')
                    }
                })
            })
        })
        bodyObs.observe(document, { childList: true, subtree: true })
    },
})
