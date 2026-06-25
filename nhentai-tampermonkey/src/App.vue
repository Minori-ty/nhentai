<script lang="ts" setup>
import SearchHeader from '@nhentai/shared/components/SearchHeader.vue'
import { triggerSearch } from '@nhentai/shared/composables/useSearchBus'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function onSearch(query: string) {
    triggerSearch(query)
    if (router.currentRoute.value.name !== 'Search') {
        router.push({ name: 'Search', query: { q: query || undefined } })
    }
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
    <SearchHeader @search="onSearch" />
    <router-view />
</template>
