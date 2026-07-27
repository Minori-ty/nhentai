<script lang="ts" setup>
import type { IResult } from '@nhentai/api'
import { LangEnum, LoadingSpinner, PageLoader } from '@nhentai/components'
import { handleImageError } from '@nhentai/utils'
import { useWindowVirtualizer } from '@tanstack/vue-virtual'
import { throttle } from 'lodash-es'
import { computed, ref, onMounted, onUnmounted } from 'vue'
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

const onResize = throttle(updateColumnCount, 100)

onMounted(() => {
    updateColumnCount()
    window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))

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

// ============================
// @tanstack/vue-virtual 窗口级虚拟滚动
// ============================
const virtualizer = useWindowVirtualizer(
    computed(() => ({
        count: rows.value.length,
        // estimateSize: 封面 ~318px + 标题 ~40px + gap-6(24px) ≈ 380px
        estimateSize: () => 380,
        overscan: 4,
        gap: 24,
    })),
)

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
                                'relative mx-auto overflow-hidden rounded-lg bg-gray-800',
                                'w-full md:w-56.25',
                                loadedImageIds.has(item.id) ? 'max-h-80' : 'h-80',
                            ]"
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
                        <!-- 漫画名 -->
                        <p
                            :class="[
                                'mx-auto mt-2 line-clamp-2 flex items-center justify-center gap-1 text-center text-sm text-gray-300 transition-colors group-hover:text-white',
                                'w-full md:w-56.25',
                            ]"
                        >
                            <img
                                v-if="getLangIcon(item.tag_ids)"
                                :src="getLangIcon(item.tag_ids)"
                                class="rounded-0.5 h-3.5 w-3.5 shrink-0"
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
