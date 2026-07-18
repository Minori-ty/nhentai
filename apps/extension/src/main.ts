import { getMe, RequestError } from '@nhentai/api'
import { preconnectImageCDNs } from '@nhentai/utils'
import { createApp } from 'vue'

import App from '../src/App.vue'
import { setUserAvatar, setUserName } from '../src/composables/useUserAvatar'
import router from '../src/router/router'

export default function main() {
    // 获取用户信息
    getMe()
        .then((me) => {
            setUserAvatar(`https://i1.nhentai.net/${me.avatar_url}`)
            setUserName(me.username)
        })
        .catch((err) => {
            if (err instanceof RequestError && err.status === 401) {
                window.location.href = 'https://nhentai.net/login'
            }
        })
    // 创建挂载点
    const root = document.createElement('div')
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
}
