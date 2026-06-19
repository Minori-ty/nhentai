<script lang="ts" setup>
import { useTagPage } from '@/composables/useTagPage'
import SortBar from '@/components/content/SortBar.vue'
import GalleryGrid from '@/components/content/GalleryGrid.vue'
import PageIndicator from '@/components/content/PageIndicator.vue'

const { results, numPages, total, sort, loading, loadingMore, isEnd, setSort } = useTagPage('language')
</script>

<template>
    <SortBar :total="total" :sort="sort" @update:sort="setSort" />

    <GalleryGrid :items="results" :loading="loading" :loading-more="loadingMore" :is-end="isEnd" />

    <PageIndicator :num-pages="numPages" :initial-page="1" />
</template>
