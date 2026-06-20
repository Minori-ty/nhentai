<script lang="ts" setup>
import { computed } from 'vue'
import { useTagPage } from '../../composables/useTagPage'
import { TagTypeEnum, type TagType } from '../../enums'
import SortBar from '../SortBar.vue'
import GalleryGrid from '../GalleryGrid.vue'
import PageIndicator from '../PageIndicator.vue'

const props = defineProps<{
    tagType: TagType
}>()

const { name, results, numPages, total, sort, loading, loadingMore, isEnd, setSort } = useTagPage(props.tagType)

const title = computed(() => {
    const label = TagTypeEnum.label(props.tagType)
    return `${label}: ${name} (${total.value})`
})
</script>

<template>
    <h1 class="px-4 pt-4 pb-2 text-3xl font-bold text-white">{{ title }}</h1>

    <SortBar :total="total" :sort="sort" @update:sort="setSort" />

    <GalleryGrid :items="results" :loading="loading" :loading-more="loadingMore" :is-end="isEnd" />

    <PageIndicator :num-pages="numPages" :initial-page="1" />
</template>
