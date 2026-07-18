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

// 429 重试倒计时
const { retryCountdown, requestWithRetry } = useRetryCountdown()

async function loadPopular() {
    await requestWithRetry(async () => {
        const items = await getPopular()
        popularItems.value = items.filter(Boolean).map((item) => ({ ...item, _page: 1 }))
    })
}

const isEnd = computed(() => page.value === numPages.value)

async function loadGallery() {
    loading.value = true
    results.value = []
    page.value = 1
    await requestWithRetry(async () => {
        const data = await getGallery(1)
        results.value = data.result.map((item) => ({ ...item, _page: 1 }))
        numPages.value = data.num_pages
    })
    loading.value = false
}

async function loadMore() {
    if (loadingMore.value || isEnd.value) return
    loadingMore.value = true
    const nextPage = page.value + 1
    await requestWithRetry(async () => {
        const data = await getGallery(nextPage)
        results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
        page.value = nextPage
        numPages.value = data.num_pages
    })
    loadingMore.value = false
}

useInfiniteScroll(loadMore, page)

onMounted(() => {
    loadGallery()
    loadPopular()
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

    <PageIndicator :num-pages="numPages" :initial-page="1" :is-mobile="true" />

    <RetryCountdownBar :retry-countdown="retryCountdown" />
</template>
