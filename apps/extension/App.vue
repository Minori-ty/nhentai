<script lang="ts" setup>
import { getMe } from '@nhentai/api'
import { SearchHeader } from '@nhentai/components'
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { initDownload } from './composables/useDownload'
import { triggerSearch } from './composables/useSearchBus'
import { userAvatar, userName } from './composables/useUserAvatar'

const router = useRouter()
const route = useRoute()

// 从 URL 的 q 参数还原搜索词（仅 Search 页面，Favorites 有自己的搜索框）
// + 号转空格，兼容 encodeURIComponent 不解码 + 的行为
const searchQuery = computed(() => (route.name === 'Search' ? String(route.query.q || '').replace(/\+/g, ' ') : ''))

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
    <SearchHeader
        :query="searchQuery"
        :user-name="userName"
        :user-avatar="userAvatar"
        @search="onSearch"
        @favorites="goFavorites"
    />
    <router-view v-slot="{ Component }">
        <KeepAlive>
            <component :is="Component" />
        </KeepAlive>
    </router-view>
</template>
