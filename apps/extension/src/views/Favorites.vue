<script lang="ts" setup>
import { getFavorites } from '@nhentai/api'
import type { IResult } from '@nhentai/api'
import { BaseBtn, GalleryGrid, PageIndicator } from '@nhentai/components'
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import DownloadOverlay from '../components/DownloadOverlay.vue'
import { useDownload, batchCheckDownloaded } from '../composables/useDownload'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { useRetryCountdown } from '../composables/useRetryCountdown'

type Item = IResult & { _page: number }

const router = useRouter()
const route = useRoute()

function resolveInitialPage(): number {
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
const results = ref<Item[]>([])
const page = ref(initialPage)
const numPages = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const query = ref(String(route.query.q || ''))
const total = ref(0)

const { dm, downloadedIds, downloadProgress } = useDownload()
const { retryCountdown, requestWithRetry } = useRetryCountdown()

function handleStartDownload(id: number) {
    downloadProgress.value = new Map([...downloadProgress.value, [id, 0]])
    dm.startDownload(id)
}

function handleRemoveDownload(id: number) {
    dm.removeDownload(id)
    const next = new Set(downloadedIds.value)
    next.delete(id)
    downloadedIds.value = next
}

function handleReDownload(id: number) {
    const next = new Set(downloadedIds.value)
    next.delete(id)
    downloadedIds.value = next
    handleStartDownload(id)
}

const isEnd = computed(() => page.value === numPages.value)

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
    } finally {
        loadingMore.value = false
    }
}

function doSearch() {
    router.replace({ query: { ...route.query, q: query.value || undefined, page: 1 } })
    page.value = 1
    loadFavorites()
}

useInfiniteScroll(loadMore, page)

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
        :open-in-new-tab="true"
    >
        <template #overlay="{ item }">
            <DownloadOverlay
                :item="item"
                :downloaded-ids="downloadedIds"
                :download-progress="downloadProgress"
                @start-download="handleStartDownload"
                @remove-download="handleRemoveDownload"
                @re-download="handleReDownload"
            />
        </template>
    </GalleryGrid>

    <!-- 页码指示器 -->
    <PageIndicator :num-pages="numPages" :initial-page="initialPage" />

    <!-- 429 重试倒计时 -->
    <div
        v-if="retryCountdown > 0"
        class="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center gap-2 bg-yellow-600 px-4 py-2 text-sm text-white"
    >
        <span>请求过于频繁，</span>
        <span class="inline-block min-w-[3ch] text-center font-mono font-bold">{{ retryCountdown }}</span>
        <span>秒后重试</span>
    </div>
</template>
