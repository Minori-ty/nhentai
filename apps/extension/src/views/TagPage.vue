<script lang="ts" setup>
import { TagTypeEnum, type TagType } from '@nhentai/api'
import { PageIndicator, SortBar, RetryCountdownBar } from '@nhentai/components'
import { computed } from 'vue'

import DownloadOverlay from '../components/DownloadOverlay.vue'
import GalleryGridVirtual from '../components/GalleryGridVirtual.vue'
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

    <GalleryGridVirtual :items="results" :loading="loading" :loading-more="loadingMore" :is-end="isEnd">
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
    </GalleryGridVirtual>

    <PageIndicator :num-pages="numPages" :initial-page="1" />

    <RetryCountdownBar :retry-countdown="retryCountdown" />
</template>
