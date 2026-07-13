import { getMe } from '@nhentai/api'
import { setUserAvatar, setUserName, GridColumnsKey } from '@nhentai/components'
import router from '@nhentai/components/router'
import { preconnectImageCDNs } from '@nhentai/utils'
import { createApp } from 'vue'

import App from './App.vue'

import './tailwind.css'
import '@nhentai/components/components.css'

// 通过 API 获取当前用户信息
;(async () => {
    try {
        const me = await getMe()
        setUserAvatar(`https://i2.nhentai.net/${me.avatar_url}`)
        setUserName(me.username)
    } catch {
        // 未登录或接口失败，不设置头像/用户名
    }
})()

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
app.provide(GridColumnsKey, true)
app.mount('#app')
