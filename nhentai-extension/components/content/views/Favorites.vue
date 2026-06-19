<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { getFavorites } from '@/api/index'
import type { IResult } from '@/api/index.d'
import GalleryGrid from '@/components/content/GalleryGrid.vue'
import PageIndicator from '@/components/content/PageIndicator.vue'
import BaseBtn from '@/components/content/BaseBtn.vue'

const router = useRouter()
const route = useRoute()

function resolveInitialPage(): number {
    // 优先取 vue-router hash 后面的 ?page=, fallback 到 location.search
    const page =
        parseInt(String(route.query.page || '')) ||
        parseInt(new URLSearchParams(location.search).get('page') || '') ||
        1
    const urlQ = new URLSearchParams(location.search).get('q') || ''
    const sync: Record<string, any> = {}
    if (!route.query.page && new URLSearchParams(location.search).get('page')) {
        sync.page = page
    }
    if (!route.query.q && urlQ) {
        sync.q = urlQ
    }
    if (Object.keys(sync).length) {
        router.replace({ query: { ...route.query, ...sync } })
    }
    return page
}
const initialPage = resolveInitialPage()
const results = ref<(IResult & { _page: number })[]>([])
const page = ref(initialPage)
const numPages = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const query = ref(String(route.query.q || ''))
const total = ref(0)

const isEnd = computed(() => page.value === numPages.value)

async function loadFavorites() {
    loading.value = true
    results.value = []
    page.value = initialPage
    try {
        const data = await getFavorites({ page: initialPage, q: query.value })
        results.value = data.result.map((item) => ({ ...item, _page: initialPage }))
        numPages.value = data.num_pages
        total.value = data.total
    } finally {
        loading.value = false
    }
}

async function loadMore() {
    if (loadingMore.value || isEnd.value) return
    loadingMore.value = true
    const nextPage = page.value + 1
    try {
        const data = await getFavorites({ page: nextPage, q: query.value })
        results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
        page.value = nextPage
        numPages.value = data.num_pages
        total.value = data.total
    } finally {
        loadingMore.value = false
    }
}

function doSearch() {
    router.replace({ query: { ...route.query, q: query.value || undefined, page: 1 } })
    page.value = 1
    loadFavorites()
}

useInfiniteScroll(loadMore)

onMounted(() => {
    loadFavorites()
})
</script>

<template>
    <!-- 收藏搜索栏 -->
    <div class="px-4 py-3">
        <div class="mx-auto flex max-w-5xl items-center gap-2">
            <input
                v-model="query"
                type="text"
                placeholder="Search favorites..."
                class="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 transition-all outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50"
                @keyup.enter="doSearch"
            />
            <BaseBtn variant="primary" @click="doSearch">搜索</BaseBtn>
        </div>
    </div>

    <!-- 搜索结果计数 -->
    <div class="mx-auto max-w-5xl px-4 py-4 text-center">
        <p class="text-2xl text-gray-400">
            共 <span class="font-semibold text-white">{{ total.toLocaleString() }}</span> 项收藏
        </p>
    </div>

    <!-- 瀑布流 -->
    <GalleryGrid
        :items="results"
        :loading="loading"
        :loading-more="loadingMore"
        :is-end="isEnd"
        empty-text="No favorites found"
    />

    <!-- 页码指示器 -->
    <PageIndicator :num-pages="numPages" :initial-page="initialPage" />
</template>
