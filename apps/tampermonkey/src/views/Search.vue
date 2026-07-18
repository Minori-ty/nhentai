<script lang="ts" setup>
import { searchGallery } from '@nhentai/api'
import type { IResult, SortMode } from '@nhentai/api'
import { GalleryGrid, PageIndicator, SortBar, RetryCountdownBar } from '@nhentai/components'
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { useRetryCountdown } from '../composables/useRetryCountdown'
import { searchBus, triggerSearch } from '../composables/useSearchBus'

type Item = IResult & { _page: number }

const router = useRouter()
const route = useRoute()

const results = ref<Item[]>([])
const page = ref(1)
const numPages = ref(1)
const query = ref(String(route.query.q || '').replace(/\+/g, ' '))
const total = ref(0)
const sort = ref<SortMode>('date')
const loading = ref(false)
const loadingMore = ref(false)

const { retryCountdown, requestWithRetry } = useRetryCountdown()

const isEnd = computed(() => page.value === numPages.value)

async function doSearch() {
    loading.value = true
    results.value = []
    page.value = 1
    try {
        const data = await requestWithRetry(() => searchGallery({ query: query.value, page: 1, sort: sort.value }))
        results.value = data.result.map((item) => ({ ...item, _page: 1 }))
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
        const data = await requestWithRetry(() =>
            searchGallery({ query: query.value, page: nextPage, sort: sort.value }),
        )
        results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
        page.value = nextPage
        numPages.value = data.num_pages
    } finally {
        loadingMore.value = false
    }
}

function onSearch(q: string) {
    query.value = q
    sort.value = 'date'
    router.replace({ query: { q: q || undefined } })
    doSearch()
}

function setSort(mode: SortMode) {
    if (sort.value === mode) return
    sort.value = mode
    doSearch()
}

useInfiniteScroll(loadMore, page)

watch(searchBus, ({ query: q, ts }) => {
    if (ts === 0) return
    if (router.currentRoute.value.name !== 'Search') {
        router.push({ name: 'Search', query: { q: q || undefined } })
    } else {
        onSearch(q)
    }
})

onMounted(() => {
    if (searchBus.value.ts > 0) {
        onSearch(searchBus.value.query)
    } else if (route.query.q) {
        triggerSearch(String(route.query.q).replace(/\+/g, ' '))
    }
})
</script>

<template>
    <SortBar :total="total" :sort="sort" @update:sort="setSort" />

    <GalleryGrid :items="results" :loading="loading" :loading-more="loadingMore" :is-end="isEnd" />

    <PageIndicator :num-pages="numPages" :is-mobile="true" />

    <RetryCountdownBar :retry-countdown="retryCountdown" />
</template>
