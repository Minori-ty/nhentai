<script lang="ts" setup>
import { getFavorites } from '@nhentai/api'
import type { IResult } from '@nhentai/api'
import { BaseBtn, GalleryGrid, PageIndicator, RetryCountdownBar } from '@nhentai/components'
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import DownloadOverlay from '../components/DownloadOverlay.vue'
import { batchCheckDownloaded } from '../composables/useDownload'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { useRetryCountdown } from '../composables/useRetryCountdown'

type Item = IResult & { _page: number }

const router = useRouter()
const route = useRoute()

/** 从 URL（hash query 优先，其次站点原先的 search）解析初始页码 */
function readInitialPage(): number {
    const fromRoute = parseInt(String(route.query.page || ''))
    if (Number.isFinite(fromRoute) && fromRoute > 0) return fromRoute
    const fromSearch = parseInt(new URLSearchParams(location.search).get('page') || '')
    if (Number.isFinite(fromSearch) && fromSearch > 0) return fromSearch
    return 1
}

function readInitialQuery(): string {
    return String(route.query.q || '') || (new URLSearchParams(location.search).get('q') ?? '')
}

const initialPage = readInitialPage()

const results = ref<Item[]>([])
const page = ref(initialPage)
const numPages = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const query = ref(readInitialQuery())
const total = ref(0)

const { retryCountdown, requestWithRetry } = useRetryCountdown()

const isEnd = computed(() => page.value >= numPages.value)

async function loadFavorites() {
    loading.value = true
    results.value = []
    page.value = initialPage
    try {
        const data = await requestWithRetry(() => getFavorites({ page: initialPage, q: query.value }))
        results.value = data.result.map((item) => ({ ...item, _page: initialPage }))
        numPages.value = data.num_pages
        total.value = data.total
        batchCheckDownloaded(data.result.map((item) => item.id))
    } catch (err) {
        console.error('[Favorites] 加载收藏失败', err)
    } finally {
        loading.value = false
    }
}

async function loadMore() {
    if (loadingMore.value || isEnd.value) return
    loadingMore.value = true
    const nextPage = page.value + 1
    try {
        const data = await requestWithRetry(() => getFavorites({ page: nextPage, q: query.value }))
        results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
        page.value = nextPage
        numPages.value = data.num_pages
        total.value = data.total
        batchCheckDownloaded(data.result.map((item) => item.id))
    } catch (err) {
        console.error('[Favorites] 加载更多失败', err)
    } finally {
        loadingMore.value = false
    }
}

function doSearch() {
    void router.replace({ query: { ...route.query, q: query.value || undefined, page: 1 } })
    page.value = 1
    void loadFavorites()
}

useInfiniteScroll(loadMore, page)

onMounted(() => {
    // 把站点原 URL 上的 page / q 参数同步进 hash 路由。
    // 放在 onMounted 里做：setup 阶段的渲染期副作用会触发多余导航。
    const search = new URLSearchParams(location.search)
    const urlPage = search.get('page')
    const urlQ = search.get('q')
    const sync: Record<string, string> = {}
    if (!route.query.page && urlPage) sync.page = String(initialPage)
    if (!route.query.q && urlQ) {
        sync.q = urlQ
        query.value = urlQ
    }
    if (Object.keys(sync).length > 0) {
        void router.replace({ query: { ...route.query, ...sync } })
    }

    void loadFavorites()
})
</script>

<template>
    <!-- 收藏搜索栏 -->
    <div class="px-4 py-3">
        <div class="mx-auto flex max-w-5xl items-center gap-2">
            <input
                v-model="query"
                type="text"
                placeholder="搜索收藏..."
                class="flex-1 rounded-lg border! border-gray-700! bg-gray-800! px-4 py-2 text-white! placeholder-gray-400 transition-all outline-none focus:border-indigo-400! focus:ring-2! focus:ring-indigo-500/50!"
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
    >
        <template #overlay="{ item }">
            <DownloadOverlay :item="item" />
        </template>
    </GalleryGrid>

    <!-- 页码指示器 -->
    <PageIndicator :num-pages="numPages" :initial-page="initialPage" />

    <RetryCountdownBar :retry-countdown="retryCountdown" />
</template>
