import { createApp } from 'vue'
import App from '@/components/content/App.vue'
import router from '@/components/content/router'
import { setUserAvatar, setUserName } from '@/composables/useUserAvatar'
import '@/assets/css/tailwind.css'

export default defineContentScript({
    matches: ['*://*.nhentai.net/*'],
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
        app.mount('#app')
    },
})
