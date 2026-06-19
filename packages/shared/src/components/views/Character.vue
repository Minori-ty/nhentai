<script lang="ts" setup>
import { useTagPage } from '../../composables/useTagPage'
import SortBar from '../SortBar.vue'
import GalleryGrid from '../GalleryGrid.vue'
import PageIndicator from '../PageIndicator.vue'

const { results, numPages, total, sort, loading, loadingMore, isEnd, setSort } = useTagPage('character')
</script>

<template>
    <SortBar :total="total" :sort="sort" @update:sort="setSort" />

    <GalleryGrid :items="results" :loading="loading" :loading-more="loadingMore" :is-end="isEnd" />

    <PageIndicator :num-pages="numPages" :initial-page="1" />
</template>
