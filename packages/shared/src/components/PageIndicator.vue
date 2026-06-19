<script lang="ts" setup>
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { throttle } from 'lodash-es'
import { GridColumnsKey } from '../types/layout'

const props = defineProps<{
    numPages: number
    initialPage?: number
}>()

const isMobile = inject(GridColumnsKey, false)
const currentPage = ref(props.initialPage || 1)

function updateCurrentPage() {
    const items = document.querySelectorAll('[data-page]')
    if (items.length === 0) return

    // 已滚动到底部：直接取最后一页
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10
    if (atBottom) {
        const last = items[items.length - 1]
        currentPage.value = Number((last as HTMLElement).dataset.page)
        return
    }

    for (const item of items) {
        const rect = item.getBoundingClientRect()
        if (rect.bottom > 120) {
            currentPage.value = Number((item as HTMLElement).dataset.page)
            return
        }
    }
}

const handleScroll = throttle(updateCurrentPage, 300)

onMounted(() => {
    updateCurrentPage()
    window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
    <div
        :class="
            isMobile
                ? 'pointer-events-none fixed top-24 right-4 z-50 rounded-lg border border-gray-700 bg-gray-800/90 px-3 py-2 text-base text-gray-300 shadow-lg backdrop-blur select-none'
                : 'pointer-events-none fixed top-32 right-4 z-50 rounded-lg border border-gray-700 bg-gray-800/90 px-3 py-2 text-base text-gray-300 shadow-lg backdrop-blur select-none'
        "
    >
        <span class="font-bold text-indigo-400">{{ currentPage }}</span>
        <span class="text-gray-500"> / </span>
        <span>{{ numPages }}</span>
    </div>
</template>
