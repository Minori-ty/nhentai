<script lang="ts" setup>
import type { IResult } from '@nhentai/api'
import { LangEnum, LoadingSpinner, PageLoader } from '@nhentai/components'
import { handleImageError } from '@nhentai/utils'
import { useWindowVirtualizer } from '@tanstack/vue-virtual'
import { throttle } from 'lodash-es'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { ComponentPublicInstance } from 'vue'

/**
 * 画廊网格中的单项，扩展自 API 的 IResult。
 * `_page` 记录该条目所在的分页页码，用于无限滚动定位。
 */
export interface GalleryItem extends IResult {
    _page: number
}

const props = defineProps<{
    /** 画廊条目列表，每项需包含 `_page` 字段 */
    items: GalleryItem[]
    /** 是否处于初始加载状态（显示 PageLoader） */
    loading?: boolean
    /** 是否正在加载更多数据（底部显示 LoadingSpinner） */
    loadingMore?: boolean
    /** 是否已到最后一页（显示 "已经没有了"） */
    isEnd?: boolean
    /** 空结果时的提示文字，默认 "No results found" */
    emptyText?: string
    /** 紧凑模式：不显示初始加载器、底部加载提示、无更多提示和空提示 */
    compact?: boolean
}>()

// ============================
// 响应式列数（与 Tailwind 断点对齐）
// ============================
const columnCount = ref(5)

function updateColumnCount() {
    const w = window.innerWidth
    if (w >= 1920) columnCount.value = 9
    else if (w >= 1536) columnCount.value = 7
    else if (w >= 1280) columnCount.value = 5
    else if (w >= 1024) columnCount.value = 4
    else if (w >= 768) columnCount.value = 3
    else columnCount.value = 2
}

// ============================
// 尺寸度量（供封面盒占位与虚拟器估算行高）
// ============================
/** 幽灵网格容器，用于量取卡片真实宽度 */
const ghostGridRef = ref<HTMLElement | null>(null)

/** 缩略图尺寸缺失时的兜底比例（nhentai 标准封面 250×353） */
const FALLBACK_THUMBNAIL = { width: 250, height: 353 }

/**
 * 读取随宿主页面变化的尺寸常量。
 *
 * Tailwind 的 `--spacing` 为 0.25rem，而根字号由宿主页面决定
 * （nhentai 将其设为 14px，故 1 个单位 = 3.5px）。
 */
function readBaseMetrics() {
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const unit = rootPx * 0.25
    return {
        unit,
        /** 对应 `max-h-80` 的像素上限 */
        maxCoverHeight: unit * 80,
        /**
         * 标题块高度：`mt-2` + 两行 `text-sm`（行高 1.25rem）。
         *
         * 该值成立的前提是标题恒为 2 行——由模板上的 `line-clamp-2` 保证
         * （注意不能用 `flex` 承载居中，否则 `display: flex` 会覆盖
         * `-webkit-box`，标题退化为 3~5 行，行高随之抖动）。
         */
        titleBlock: unit * 2 + rootPx * 1.25 * 2,
    }
}

/** 卡片宽度从幽灵网格量取，CSS 断点决定具体值（`w-full` / `md:w-56.25`） */
const metrics = ref({ ...readBaseMetrics(), cardWidth: 0 })

function updateMetrics() {
    const base = readBaseMetrics()
    const first = ghostGridRef.value?.firstElementChild
    const measured = first instanceof HTMLElement ? first.offsetWidth : 0
    metrics.value = { ...base, cardWidth: measured > 0 ? measured : base.unit * 56.25 }
    // 尺寸常量与测量缓存耦合，变更后必须让虚拟器重新测量
    virtualizer.value.measure()
}

const onResize = throttle(() => {
    updateColumnCount()
    updateMetrics()
}, 100)

// ============================
// 按列数切割 items 为二维行
// ============================
const rows = computed(() => {
    const cols = columnCount.value
    const result: GalleryItem[][] = []
    for (let i = 0; i < props.items.length; i += cols) {
        result.push(props.items.slice(i, i + cols))
    }
    return result
})

/** 缩略图真实宽高比，缺失时回退到标准封面比例 */
function thumbnailRatio(item: GalleryItem): { width: number; height: number } {
    const { thumbnail_width, thumbnail_height } = item
    return thumbnail_width > 0 && thumbnail_height > 0
        ? { width: thumbnail_width, height: thumbnail_height }
        : FALLBACK_THUMBNAIL
}

/**
 * 封面盒的 `aspect-ratio` 值。
 *
 * **必须由数据在图片加载前就确定**：一旦占位尺寸与图片真实高度不一致，
 * 图片加载完成时行高就会变化，虚拟器为此补偿滚动位置，表现为"往下滚却往上跳"。
 * 配合 `max-h-80` 后，其最终高度与原 `h-auto` + `max-h-80` 完全一致。
 */
function coverAspectRatio(item: GalleryItem): string {
    const { width, height } = thumbnailRatio(item)
    return `${width} / ${height}`
}

/**
 * 估算某一行的渲染高度（不含虚拟器 `gap`）。
 *
 * 封面高度由缩略图真实宽高比算出并受 `max-h-80` 截断，标题块按两行 `text-sm` 计。
 * 估算值越贴近实际，未测量行造成的虚拟高度偏差越小。
 */
function estimateRowHeight(index: number): number {
    const row = rows.value[index]
    if (!row || row.length === 0) return 0

    const { cardWidth, maxCoverHeight, titleBlock } = metrics.value
    let maxCoverInRow = 0
    for (const item of row) {
        const { width, height } = thumbnailRatio(item)
        const cover = Math.min((cardWidth * height) / width, maxCoverHeight)
        if (cover > maxCoverInRow) maxCoverInRow = cover
    }
    return Math.round(maxCoverInRow + titleBlock)
}

// ============================
// @tanstack/vue-virtual 窗口级虚拟滚动
// ============================
const virtualizer = useWindowVirtualizer(
    computed(() => ({
        count: rows.value.length,
        estimateSize: estimateRowHeight,
        overscan: 4,
        gap: 24,
    })),
)

onMounted(() => {
    updateColumnCount()
    updateMetrics()
    window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))

// 幽灵网格在数据加载完成后才渲染，出现时补测一次卡片宽度
watch(ghostGridRef, (el) => {
    if (el) updateMetrics()
})

const virtualRows = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

/**
 * `:ref` 回调：每行渲染后通知虚拟器测量实际高度。
 * vue-virtual 内部从 `data-index` 属性自动读取行号。
 */
function measureRow(el: Element | ComponentPublicInstance | null) {
    if (el instanceof HTMLElement) {
        virtualizer.value.measureElement(el)
    }
}

// ============================
// 工具函数
// ============================

/**
 * 根据 tag_ids 匹配语言图标。
 * 遍历 LangEnum 条目，返回匹配语言对应的 SVG icon URL。
 */
function getLangIcon(tagIds: number[]): string | undefined {
    for (const item of LangEnum.items) {
        if (tagIds.includes(item.value)) return item.raw.icon
    }
    return undefined
}

/** 生成缩略图 CDN URL */
function getThumbnailUrl(thumbnail: string): string {
    return `https://t1.nhentai.net/${thumbnail}`
}

/**
 * 已加载图片的 ID 集合，用于控制 placeholder 的显示。
 *
 * 使用 `requestAnimationFrame` 延迟状态更新，确保即使图片从缓存同步加载，
 * placeholder 也能至少渲染一帧，避免 `v-show` 因快速响应式更新跳过初始渲染。
 */
const loadedImageIds = ref(new Set<number>())

function onImageLoad(itemId: number) {
    requestAnimationFrame(() => {
        const next = new Set(loadedImageIds.value)
        next.add(itemId)
        loadedImageIds.value = next
    })
}
</script>

<template>
    <!-- 初始加载状态 -->
    <PageLoader v-if="!compact && loading" />

    <!-- 画廊网格（虚拟滚动） -->
    <div v-if="compact || !loading" class="mx-auto w-fit rounded-xl bg-[#2A3744] px-4 py-6">
        <!--
            幽灵网格（不可见）：撑起 w-fit 容器宽度。
            9 个占位符与 Tailwind 响应式断点对齐，CSS 自动决定当前显示的列数，
            多余占位符被 overflow:hidden 裁掉，使父容器宽度与真实网格完全一致。
        -->
        <div
            ref="ghostGridRef"
            class="3xl:grid-cols-9 invisible grid h-0 grid-cols-2 justify-center gap-6 overflow-hidden md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7"
        >
            <div v-for="i in 9" :key="'ghost-' + i" class="w-full md:w-56.25" />
        </div>

        <!-- 虚拟滚动容器 -->
        <div :style="{ position: 'relative', height: `${totalSize}px` }">
            <div
                v-for="vRow in virtualRows"
                :key="vRow.index"
                :data-index="vRow.index"
                :ref="measureRow"
                :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vRow.start}px)`,
                }"
            >
                <div
                    class="3xl:grid-cols-9 grid grid-cols-2 justify-center gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7"
                >
                    <router-link
                        v-for="item in rows[vRow.index]"
                        :key="item.id"
                        :data-page="item._page"
                        :to="{ name: 'Detail', params: { id: item.id } }"
                        class="group block text-current"
                    >
                        <!-- 封面图 -->
                        <div
                            :class="[
                                'relative mx-auto max-h-80 overflow-hidden rounded-lg bg-gray-800',
                                'w-full md:w-56.25',
                            ]"
                            :style="{ aspectRatio: coverAspectRatio(item) }"
                        >
                            <!-- shimmer placeholder 图片加载前显示（v-show 保证元素始终在 DOM 中） -->
                            <div
                                v-show="!loadedImageIds.has(item.id)"
                                class="animate-shimmer pointer-events-none absolute inset-0 z-10"
                            />
                            <!-- overlay slot -->
                            <slot name="overlay" :item="item" />

                            <img
                                :src="getThumbnailUrl(item.thumbnail)"
                                :alt="item.japanese_title || item.english_title"
                                :class="[
                                    'transition-all duration-500 group-hover:scale-110',
                                    loadedImageIds.has(item.id)
                                        ? 'h-auto w-full opacity-100'
                                        : 'h-full w-full object-cover opacity-0',
                                ]"
                                loading="lazy"
                                @load="onImageLoad(item.id)"
                                @error="handleImageError"
                            />
                        </div>
                        <!--
                            漫画名：必须限制在 2 行（`titleBlock` 估算依赖此不变式）。
                            `line-clamp-2` 的 `display: -webkit-box` 会被 `flex` 覆盖，
                            故不能用 flex 居中，改为文字 `text-center` +
                            旗帜图标 `inline-block align-middle`（与 nhentai 原站一致）。
                        -->
                        <p
                            :class="[
                                'mx-auto mt-2 line-clamp-2 text-center text-sm text-gray-300 transition-colors group-hover:text-white',
                                'w-full md:w-56.25',
                            ]"
                        >
                            <img
                                v-if="getLangIcon(item.tag_ids)"
                                :src="getLangIcon(item.tag_ids)"
                                class="rounded-0.5 mr-1 inline-block h-3.5 w-3.5 align-middle"
                            />
                            {{ item.japanese_title || item.english_title || `#${item.id}` }}
                        </p>
                    </router-link>
                </div>
            </div>
        </div>

        <!-- 底部加载中 -->
        <div v-if="!compact && loadingMore" class="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
        </div>

        <!-- 已到底 -->
        <div v-if="!compact && isEnd && items.length > 0" class="pt-8 text-center text-gray-500">- 已经没有了 -</div>

        <!-- 空结果 -->
        <div v-if="!compact && items.length === 0 && !loading" class="py-20 text-center text-gray-400">
            {{ emptyText || 'No results found' }}
        </div>
    </div>
</template>

<style scoped>
@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.animate-shimmer {
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%);
    animation: shimmer 1.8s ease-in-out infinite;
}
</style>
