import { createApp } from 'vue'
import App from './App.vue'
import router from '@nhentai/shared/components/router'
import { setUserAvatar, setUserName } from '@nhentai/shared/composables/useUserAvatar'
import { GridColumnsKey } from '@nhentai/shared/types/layout'
import '@nhentai/shared/assets/css/tailwind.css'

// 在清除之前获取头像 URL
const avatarImg = document.querySelector<HTMLImageElement>(
    '#app > nav > div > ul.menu.right > li:nth-child(2) > a > img',
)
if (avatarImg) {
    setUserAvatar(avatarImg.src)
}

const nameEl = document.querySelector<HTMLElement>('#app > nav > div > ul.menu.right > li:nth-child(2) > a > span')
if (nameEl) {
    setUserName(nameEl.innerText.trim())
}

// 清除 body 内容
document.body.innerHTML = ''

// 创建挂载点
const root = document.createElement('div')
root.className = 'bg-[#202a34]'
root.id = 'app'
document.body.appendChild(root)

// 挂载 Vue 应用
const app = createApp(App)
app.use(router)
app.provide(GridColumnsKey, true)
app.mount('#app')
