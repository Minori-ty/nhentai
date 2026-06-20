<script lang="ts" setup>
import { ref, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { getGalleryInfo } from '@nhentai/shared/api'
import type { IGallery } from '@nhentai/shared/api/info.d'
import { GridColumnsKey } from '@nhentai/shared/types/layout'
import PageLoader from '@nhentai/shared/components/PageLoader.vue'

const route = useRoute()
const gallery = ref<IGallery | null>(null)
const loading = ref(true)
const loadedCount = ref(0)
const isMobile = inject(GridColumnsKey, false)

function getImageUrl(page: { number: number; path: string }, _mediaId: string): string {
    return `https://i1.nhentai.net/${page.path}`
}

function getImageStyle(page: { width: number; height: number }) {
    if (isMobile) {
        const ratio = page.width / page.height
        const w = window.innerWidth
        const h = Math.round(w / ratio)
        return { width: `${w}px`, height: `${h}px` }
    }
    const ratio = page.width / page.height
    const h = Math.round(window.innerHeight * 0.9)
    const w = Math.round(h * ratio)
    return { height: `${h}px`, width: `${w}px` }
}

function onImageLoad() {
    loadedCount.value++
}

function onImageError(event: Event) {
    const img = event.target
    if (!(img instanceof HTMLImageElement)) {
        return
    }
    // CDN subdomain fallback
    const match = img.src.match(/\/\/(i\d)\./)
    if (!match) return
    const subdomains = ['i1', 'i2', 'i3', 'i4']
    const idx = subdomains.indexOf(match[1])
    if (idx === -1 || idx >= subdomains.length - 1) return
    img.src = img.src.replace(`//${match[1]}.`, `//${subdomains[idx + 1]}.`)
}

onMounted(async () => {
    const id = Number(route.params.id)
    try {
        gallery.value = await getGalleryInfo(id)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <!-- 加载中 -->
    <PageLoader v-if="loading" />

    <!-- 图片列表 -->
    <template v-else-if="gallery">
        <div class="flex flex-col items-center gap-2 py-4">
            <div v-for="page in gallery.pages" :key="page.number" class="relative shrink-0">
                <!-- 页码 -->
                <span class="absolute top-3 left-3 z-10 rounded bg-black/60 px-3 py-1 text-sm font-semibold text-white">
                    {{ page.number }} / {{ gallery.num_pages }}
                </span>
                <img
                    :src="getImageUrl(page, gallery.media_id)"
                    :style="getImageStyle(page)"
                    class="block bg-[#2A3744] object-contain"
                    :alt="`Page ${page.number}`"
                    @load="onImageLoad"
                    @error="onImageError"
                    loading="lazy"
                />
            </div>
        </div>

        <!-- 图片加载指示器 -->
        <div
            v-if="loadedCount !== gallery.num_pages"
            :class="[
                'fixed -translate-y-1/2 rounded-lg bg-black/70 px-3 py-2 font-mono text-base text-white',
                isMobile ? 'top-24 right-0' : 'top-32 right-4',
            ]"
        >
            {{ loadedCount }} / {{ gallery.num_pages }}
        </div>
    </template>
</template>
