<script lang="ts" setup>
import { getGalleryInfo } from '@nhentai/api'
import type { IGallery } from '@nhentai/api'
import { PageLoader } from '@nhentai/components'
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute<'Single'>()
const gallery = ref<IGallery | null>(null)
const loading = ref(true)
const loadedCount = ref(0)
const listRef = ref<HTMLElement | null>(null)

// --- CDN subdomain 退避策略 ---
// 成功加载过的 subdomain 会被记住，后续优先使用
const SUBDOMAINS = ['i1', 'i2', 'i3', 'i4']
let preferredSubdomain = 'i1'

function resolveStartPage(): number {
    const raw = parseInt(String(route.query.page || ''))
    return Number.isFinite(raw) && raw >= 1 ? raw : 1
}

function getImageUrl(page: { number: number; path: string }): string {
    return `https://${preferredSubdomain}.nhentai.net/${page.path}`
}

function getImageStyle(page: { width: number; height: number }) {
    const ratio = page.width / page.height
    const w = window.innerWidth
    const h = Math.round(w / ratio)
    return { width: `${w}px`, height: `${h}px` }
}

function onImageLoad() {
    loadedCount.value++
}

function onImageError(event: Event) {
    const img = event.target
    if (!(img instanceof HTMLImageElement)) {
        return
    }
    // CDN subdomain 退避：尝试下一个 subdomain，成功则更新首选
    const match = img.src.match(/\/\/(i\d)\./)
    if (!match) return
    const idx = SUBDOMAINS.indexOf(match[1])
    if (idx === -1 || idx >= SUBDOMAINS.length - 1) return
    const nextSub = SUBDOMAINS[idx + 1]
    img.src = img.src.replace(`//${match[1]}.`, `//${nextSub}.`)

    // 当前失败的是首选 subdomain，则在 fallback 加载成功后更新首选
    if (match[1] === preferredSubdomain) {
        const handler = () => {
            preferredSubdomain = nextSub
            img.removeEventListener('load', handler)
        }
        img.addEventListener('load', handler)
    }
}

onMounted(async () => {
    const id = Number(route.params.id)
    const startPage = resolveStartPage()
    try {
        gallery.value = await getGalleryInfo(id)
    } finally {
        loading.value = false
    }
    if (startPage > 1 && startPage <= gallery.value!.num_pages) {
        await nextTick()
        const el = listRef.value?.querySelector(`[data-page="${startPage}"]`)
        if (el) {
            el.scrollIntoView()
        }
    }
})
</script>

<template>
    <!-- 加载中 -->
    <PageLoader v-if="loading" />

    <!-- 图片列表 -->
    <template v-else-if="gallery">
        <div ref="listRef" class="flex flex-col items-center gap-2 py-4">
            <div v-for="page in gallery.pages" :key="page.number" :data-page="page.number" class="relative shrink-0">
                <!-- 页码 -->
                <span class="absolute top-3 left-3 z-10 rounded bg-black/60 px-3 py-1 text-sm font-semibold text-white">
                    {{ page.number }} / {{ gallery.num_pages }}
                </span>
                <img
                    :src="getImageUrl(page)"
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
            class="fixed top-24 right-0 rounded-l-lg bg-black/70 px-3 py-2 font-mono text-base text-white"
        >
            {{ loadedCount }} / {{ gallery.num_pages }}
        </div>
    </template>
</template>
