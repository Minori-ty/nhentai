import { preconnectImageCDNs } from '@nhentai/utils'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

import './tailwind.css'
import '@nhentai/components/components.css'

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
app.mount('#app')
