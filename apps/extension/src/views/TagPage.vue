<script lang="ts" setup>
import { TagTypeEnum, type TagType } from '@nhentai/api'
import { GalleryGrid, PageIndicator, SortBar } from '@nhentai/components'
import { computed } from 'vue'

import DownloadOverlay from '../components/DownloadOverlay.vue'
import { useDownload } from '../composables/useDownload'
import { useTagPage } from '../composables/useTagPage'

const props = defineProps<{
    tagType: TagType
}>()

const { name, results, numPages, total, sort, loading, loadingMore, isEnd, retryCountdown, setSort } = useTagPage(
    props.tagType,
)
const { dm, downloadedIds, downloadProgress } = useDownload()

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

const title = computed(() => {
    const label = TagTypeEnum.label(props.tagType)
    return `${label}: ${name.value} (${total.value})`
})
</script>

<template>
    <h1 class="px-4 pt-4 pb-2 text-3xl font-bold text-white">{{ title }}</h1>

    <SortBar :total="total" :sort="sort" @update:sort="setSort" />

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
