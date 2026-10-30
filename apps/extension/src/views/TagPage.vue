<script lang="ts" setup>
import { TagTypeEnum, type TagType } from '@nhentai/api'
import { PageIndicator, SortBar, RetryCountdownBar } from '@nhentai/components'
import { computed } from 'vue'

import DownloadOverlay from '../components/DownloadOverlay.vue'
import GalleryGridVirtual from '../components/GalleryGridVirtual.vue'
import { useTagPage } from '../composables/useTagPage'

const props = defineProps<{
    tagType: TagType
}>()

// 传 getter 而不是值：6 条标签路由复用同一组件实例，props.tagType 会变
const { name, results, numPages, total, sort, loading, loadingMore, isEnd, retryCountdown, setSort } = useTagPage(
    () => props.tagType,
)

const title = computed(() => {
    const label = TagTypeEnum.label(props.tagType)
    return `${label}: ${name.value} (${total.value})`
})
</script>

<template>
    <h1 class="px-4 pt-4 pb-2 text-3xl font-bold text-white">{{ title }}</h1>

    <SortBar :total="total" :sort="sort" @update:sort="setSort" />

    <GalleryGridVirtual :items="results" :loading="loading" :loading-more="loadingMore" :is-end="isEnd">
        <template #overlay="{ item }">
            <DownloadOverlay :item="item" />
        </template>
    </GalleryGridVirtual>

    <PageIndicator :num-pages="numPages" :initial-page="1" />

    <RetryCountdownBar :retry-countdown="retryCountdown" />
</template>
