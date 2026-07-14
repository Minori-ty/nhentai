<script lang="ts" setup>
import { getMe } from '@nhentai/api'
import { SearchHeader } from '@nhentai/components'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { initDownload } from './composables/useDownload'
import { triggerSearch } from './composables/useSearchBus'
import { setUserAvatar, setUserName, userAvatar, userName } from './composables/useUserAvatar'

const router = useRouter()

// 获取用户信息
getMe().then((me) => {
    setUserAvatar(`https://i2.nhentai.net/${me.avatar_url}`)
    setUserName(me.username)
})

// 初始化下载管理器
import('./utils/downloadManager').then(({ createDownloadManager }) => {
    initDownload(createDownloadManager())
})

function onSearch(query: string) {
    triggerSearch(query)
    if (router.currentRoute.value.name !== 'Search') {
        router.push({ name: 'Search', query: { q: query || undefined } })
    }
}

function goFavorites() {
    router.push({ name: 'Favorites' })
}

onMounted(() => {
    const path = location.pathname
    if (path === '/') {
        return
    }
    if (path === '/search/') {
        router.replace({ name: 'Search' })
        return
    }
    const galleryMatch = path.match(/^\/g\/(\d+)/)
    if (galleryMatch) {
        router.replace({ name: 'Detail', params: { id: galleryMatch[1] } })
        return
    }
    if (path === '/user/favorites') {
        router.replace({ name: 'Favorites' })
        return
    }
})
</script>

<template>
    <SearchHeader :user-name="userName" :user-avatar="userAvatar" @search="onSearch" @favorites="goFavorites" />
    <router-view v-slot="{ Component }">
        <KeepAlive>
            <component :is="Component" />
        </KeepAlive>
    </router-view>
</template>
