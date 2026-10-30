<script lang="ts" setup>
import { getGallery, getPopular } from '@nhentai/api'
import type { IResult } from '@nhentai/api'
import { GalleryGrid, PageIndicator, RetryCountdownBar } from '@nhentai/components'
import { ref, onMounted, computed } from 'vue'

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

const { retryCountdown, requestWithRetry } = useRetryCountdown()

async function loadPopular() {
    try {
        await requestWithRetry(async () => {
            const items = await getPopular()
            popularItems.value = items.filter(Boolean).map((item) => ({ ...item, _page: 1 }))
        })
    } catch (err) {
        // 热门区块是锦上添花，失败不影响主列表
        console.error('[Home] 获取 Popular Now 失败', err)
    }
}

const isEnd = computed(() => page.value >= numPages.value)

async function loadMore() {
    if (loadingMore.value || isEnd.value) return
    loadingMore.value = true
    const nextPage = page.value + 1
    try {
        await requestWithRetry(async () => {
            const data = await getGallery(nextPage)
            results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
            page.value = nextPage
            numPages.value = data.num_pages
        })
    } catch (err) {
        console.error('[Home] 加载更多失败', err)
    } finally {
        // 必须放在 finally：一旦请求抛错，写在外面会让 loadingMore 永久为 true
        loadingMore.value = false
    }
}

async function loadGallery() {
    loading.value = true
    results.value = []
    page.value = 1
    try {
        await requestWithRetry(async () => {
            const data = await getGallery(1)
            results.value = data.result.map((item) => ({ ...item, _page: 1 }))
            numPages.value = data.num_pages
        })
    } catch (err) {
        console.error('[Home] 加载首页失败', err)
    } finally {
        loading.value = false
    }
}

useInfiniteScroll(loadMore, page)

onMounted(() => {
    void loadGallery()
    void loadPopular()
})
</script>

<template>
    <!-- Popular Now -->
    <template v-if="popularItems.length > 0">
        <div class="mx-auto w-fit px-4 pt-6">
            <h2 class="mb-4 text-xl font-bold text-white">Popular Now</h2>
        </div>
        <GalleryGrid :items="popularItems" :is-end="true" compact />
    </template>

    <!-- 主列表 -->
    <div :class="popularItems.length > 0 ? 'mt-8' : ''">
        <GalleryGrid :items="results" :loading="loading" :loading-more="loadingMore" :is-end="isEnd" />
    </div>

    <PageIndicator :num-pages="numPages" :initial-page="1" />

    <RetryCountdownBar :retry-countdown="retryCountdown" />
</template>
