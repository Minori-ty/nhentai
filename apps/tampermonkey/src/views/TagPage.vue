<script lang="ts" setup>
import { TagTypeEnum, type TagType } from '@nhentai/api'
import { GalleryGrid, PageIndicator, SortBar, RetryCountdownBar } from '@nhentai/components'
import { computed } from 'vue'

import { useTagPage } from '../composables/useTagPage'

const props = defineProps<{
    tagType: TagType
}>()

const { name, results, numPages, total, sort, loading, loadingMore, isEnd, retryCountdown, setSort } = useTagPage(
    props.tagType,
)

const title = computed(() => {
    const label = TagTypeEnum.label(props.tagType)
    return `${label}: ${name.value} (${total.value})`
})
</script>

<template>
    <h1 class="px-4 pt-4 pb-2 text-3xl font-bold text-white">{{ title }}</h1>

    <SortBar :total="total" :sort="sort" @update:sort="setSort" />

    <GalleryGrid :items="results" :loading="loading" :loading-more="loadingMore" :is-end="isEnd" />

    <PageIndicator :num-pages="numPages" :initial-page="1" :is-mobile="true" />

    <RetryCountdownBar :retry-countdown="retryCountdown" />
</template>
