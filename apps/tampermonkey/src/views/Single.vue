<script lang="ts" setup>
import { getGalleryInfo } from '@nhentai/api'
import type { IGallery } from '@nhentai/api'
import { PageLoader } from '@nhentai/components'
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute<'Single'>()

// 显式声明组件名：App.vue 的 `<KeepAlive :exclude="['Single']">` 靠它匹配，
// 依赖编译期推断的 __name 在构建配置变化时可能失效
defineOptions({ name: 'Single' })
const gallery = ref<IGallery | null>(null)
const loading = ref(true)
const loadError = ref('')
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

/**
 * 单页尺寸完全交由 CSS 决定。
 *
 * 高度基准 90vh，宽度由原始宽高比推导，并**用 `min(100%, …)` 夹住容器宽度**：
 * 横版跨页（如 2000×1400）按 90vh 算出来约 128vh 宽，不加夹取会直接撑出横向滚动条。
 *
 * 宽度必须挂在「图片盒」上而不是 `<img>` 上：页码角标是相对图片盒绝对定位的，
 * 盒子要收紧到图片宽度才能贴住图片左上角（外层容器是全宽居中的）。
 */
function getBoxStyle(page: { width: number; height: number }): Record<string, string> {
    if (!(page.width > 0) || !(page.height > 0)) return { width: '100%' }
    return { width: `min(100%, calc(90vh * ${page.width / page.height}))` }
}

/**
 * `aspect-ratio` 让图片在加载前就占好位，避免逐页加载时整页高度不断跳动。
 *
 * 之所以不写死 `height: 90vh`：那会让宽高比在 `max-width` 生效时失效，
 * 只能靠 `object-contain` 事后补 letterbox，空间仍然是溢出的。
 */
function getImageStyle(page: { width: number; height: number }): Record<string, string> {
    if (!(page.width > 0) || !(page.height > 0)) return { maxHeight: '90vh' }
    return { aspectRatio: `${page.width} / ${page.height}` }
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
        const data = await getGalleryInfo(id)
        gallery.value = data

        if (startPage > 1 && startPage <= data.num_pages) {
            await nextTick()
            const el = listRef.value?.querySelector(`[data-page="${startPage}"]`)
            el?.scrollIntoView()
        }
    } catch (err) {
        loadError.value = err instanceof Error ? err.message : String(err)
        console.error('[Single] 加载画廊失败', err)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <!-- 加载中 -->
    <PageLoader v-if="loading" />

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="py-20 text-center text-gray-400">加载失败：{{ loadError }}</div>

    <!-- 图片列表 -->
    <template v-else-if="gallery">
        <div ref="listRef" class="flex flex-col items-center gap-2 py-4">
            <div
                v-for="page in gallery.pages"
                :key="page.number"
                :data-page="page.number"
                class="flex w-full shrink-0 justify-center"
            >
                <!--
                    定位容器：宽度由 getBoxStyle 收紧到图片实际宽度，页码角标才能贴住图片左上角。
                    （不能把 `relative` 放在外层全宽的行容器上，否则角标会飘到整行最左侧）
                -->
                <div class="relative" :style="getBoxStyle(page)">
                    <!-- 页码 -->
                    <span
                        class="absolute top-3 left-3 z-10 rounded bg-black/60 px-3 py-1 text-sm font-semibold text-white"
                    >
                        {{ page.number }} / {{ gallery.num_pages }}
                    </span>
                    <img
                        :src="getImageUrl(page)"
                        :style="getImageStyle(page)"
                        class="block w-full max-w-full bg-[#2A3744] object-contain"
                        :alt="`Page ${page.number}`"
                        @load="onImageLoad"
                        @error="onImageError"
                        loading="lazy"
                    />
                </div>
            </div>
        </div>

        <!-- 图片加载指示器 -->
        <div
            v-if="loadedCount !== gallery.num_pages"
            class="fixed top-32 right-4 -translate-y-1/2 rounded-lg bg-black/70 px-3 py-2 font-mono text-base text-white"
        >
            {{ loadedCount }} / {{ gallery.num_pages }}
        </div>
    </template>
</template>

<style scoped>
[data-page] {
    scroll-margin-top: 64px;
}
</style>
