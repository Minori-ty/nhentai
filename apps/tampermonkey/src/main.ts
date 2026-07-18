import { getMe } from '@nhentai/api'
import { preconnectImageCDNs } from '@nhentai/utils'
import { createApp } from 'vue'

import App from './App.vue'
import { setUserAvatar, setUserName } from './composables/useUserAvatar'
import router from './router/router'

import './tailwind.css'

// 获取用户信息
getMe().then((me) => {
    setUserAvatar(`https://i1.nhentai.net/${me.avatar_url}`)
    setUserName(me.username)
})

// CDN 预连接
preconnectImageCDNs()

// 清除 body 内容
document.body.innerHTML = ''

// 创建挂载点
const root = document.createElement('div')
root.id = 'app'
document.body.appendChild(root)

// 挂载 Vue 应用
const app = createApp(App)
app.use(router)
app.mount('#app')
