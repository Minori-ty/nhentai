import { getMe, RequestError } from '@nhentai/api'
import { preconnectImageCDNs } from '@nhentai/utils'
import { createApp } from 'vue'

import App from '../src/App.vue'
import { initDownload } from '../src/composables/useDownload'
import { setUserAvatar, setUserName } from '../src/composables/useUserAvatar'
import router from '../src/router/router'
import { createDownloadManager } from '../src/utils/downloadManager'

export default function main() {
    // 下载管理器必须在挂载应用之前同步初始化：
    // 视图一渲染就可能读它，动态 import 会让「初始化」和「首次使用」产生竞态。
    initDownload(createDownloadManager())

    // 获取用户信息
    getMe()
        .then((me) => {
            setUserAvatar(`https://i1.nhentai.net/${me.avatar_url}`)
            setUserName(me.username)
        })
        .catch((err: unknown) => {
            if (err instanceof RequestError && err.status === 401) {
                window.location.href = 'https://nhentai.net/login'
                return
            }
            console.error('[main] 获取用户信息失败', err)
        })

    // 创建挂载点
    const root = document.createElement('div')
    root.id = 'app'

    let booted = false

    function bootstrap(originalBody: HTMLElement) {
        booted = true
        bodyObs.disconnect()

        // CDN 预连接只需做一次（preconnectImageCDNs 内部也做了幂等）
        preconnectImageCDNs()

        // 清除 body 内容，替换成自己的容器
        originalBody.remove()
        const body = document.createElement('body')
        document.documentElement.appendChild(body)
        body.appendChild(root)

        // 挂载 Vue 应用
        const app = createApp(App)
        app.use(router)
        app.mount(root)
    }

    /**
     * 只为了等 `<body>` 出现。
     *
     * 早先是「每次有 head/body 插入都处理一遍」并且从不 disconnect，
     * 等于给整个文档挂了 subtree 级观察器，SPA 里每帧都有回调，直到页面关闭。
     */
    const bodyObs = new MutationObserver((records) => {
        if (booted) return
        for (const record of records) {
            for (const node of record.addedNodes) {
                if (node instanceof HTMLBodyElement) {
                    bootstrap(node)
                    return
                }
            }
        }
    })

    // document_start 下 body 通常还不存在，但缓存/极速加载时可能已经有了
    if (document.body) {
        bootstrap(document.body)
    } else {
        bodyObs.observe(document, { childList: true, subtree: true })
    }
}
