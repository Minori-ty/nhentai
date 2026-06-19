<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { getGallery, getPopular } from '../../api'
import type { IResult } from '../../api/index.d'
import { useInfiniteScroll } from '../../composables/useInfiniteScroll'
import GalleryGrid from '../GalleryGrid.vue'
import PageIndicator from '../PageIndicator.vue'

const results = ref<(IResult & { _page: number })[]>([])
const page = ref(1)
const numPages = ref(1)
const loading = ref(false)
const loadingMore = ref(false)

// Popular Now
const popularItems = ref<(IResult & { _page: number })[]>([])

async function loadPopular() {
    try {
        const items = await getPopular()
        popularItems.value = items.filter(Boolean).map((item) => ({ ...item, _page: 1 }))
    } catch {
        // popular 加载失败不影响主列表
    }
}

const isEnd = computed(() => page.value === numPages.value)

async function loadGallery() {
    loading.value = true
    results.value = []
    page.value = 1
    try {
        const data = await getGallery(1)
        results.value = data.result.map((item) => ({ ...item, _page: 1 }))
        numPages.value = data.num_pages
    } finally {
        loading.value = false
    }
}

async function loadMore() {
    if (loadingMore.value || isEnd.value) return
    loadingMore.value = true
    const nextPage = page.value + 1
    try {
        const data = await getGallery(nextPage)
        results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
        page.value = nextPage
        numPages.value = data.num_pages
    } finally {
        loadingMore.value = false
    }
}

useInfiniteScroll(loadMore)

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

    <PageIndicator :num-pages="numPages" :initial-page="1" />
</template>
