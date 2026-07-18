<script lang="ts" setup>
import { getGallery, getPopular } from '@nhentai/api'
import type { IResult } from '@nhentai/api'
import { GalleryGrid, PageIndicator } from '@nhentai/components'
import { ref, onMounted, computed } from 'vue'

import DownloadOverlay from '../components/DownloadOverlay.vue'
import { useDownload, batchCheckDownloaded } from '../composables/useDownload'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { useRetryCountdown } from '../composables/useRetryCountdown'

type Item = IResult & { _page: number }

const results = ref<Item[]>([])
const page = ref(1)
const numPages = ref(1)
const loading = ref(false)
const loadingMore = ref(false)

// Popular Now
const popularItems = ref<Item[]>([])

const { dm, downloadedIds, downloadProgress } = useDownload()

// 429 重试倒计时
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

async function loadPopular() {
    await requestWithRetry(async () => {
        const items = await getPopular()
        popularItems.value = items.filter(Boolean).map((item) => ({ ...item, _page: 1 }))
    })
}

const isEnd = computed(() => page.value === numPages.value)

async function loadMore() {
    if (loadingMore.value || isEnd.value) return
    loadingMore.value = true
    const nextPage = page.value + 1
    await requestWithRetry(async () => {
        const data = await getGallery(nextPage)
        results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
        page.value = nextPage
        numPages.value = data.num_pages
        batchCheckDownloaded(data.result.map((item) => item.id))
    })
    loadingMore.value = false
}

useInfiniteScroll(loadMore, page)

onMounted(() => {
    loadGallery()
    loadPopular()
})

async function loadGallery() {
    loading.value = true
    results.value = []
    page.value = 1
    await requestWithRetry(async () => {
        const data = await getGallery(1)
        results.value = data.result.map((item) => ({ ...item, _page: 1 }))
        numPages.value = data.num_pages
        batchCheckDownloaded(data.result.map((item) => item.id))
    })
    loading.value = false
}
</script>

<template>
    <!-- Popular Now -->
    <template v-if="popularItems.length > 0">
        <div class="mx-auto w-fit px-4 pt-6">
            <h2 class="mb-4 text-xl font-bold text-white">Popular Now</h2>
        </div>
        <GalleryGrid :items="popularItems" :is-end="true" compact :open-in-new-tab="true">
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
    </template>

    <!-- 主列表 -->
    <div :class="popularItems.length > 0 ? 'mt-8' : ''">
        <GalleryGrid
            :items="results"
            :loading="loading"
            :loading-more="loadingMore"
            :is-end="isEnd"
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
    </div>

    <PageIndicator :num-pages="numPages" :initial-page="1" />

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
