<script lang="ts" setup>
import type { IResult } from '@nhentai/api'
import { handleImageError } from '@nhentai/utils'
import { useWindowVirtualizer } from '@tanstack/vue-virtual'
import { throttle } from 'lodash-es'
import { computed, onMounted, onUnmounted, ref, type ComponentPublicInstance } from 'vue'

import { LangEnum } from '../enums'
import LoadingSpinner from './LoadingSpinner.vue'
import PageLoader from './PageLoader.vue'

/**
 * 画廊网格中的单项，扩展自 API 的 IResult。
 * `_page` 记录该条目所在的分页页码，用于无限滚动定位。
 */
export interface GalleryItem extends IResult {
    _page: number
}

const props = withDefaults(
    defineProps<{
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
        /** 点击画廊时是否在新标签打开，默认 false */
        openInNewTab?: boolean
    }>(),
    {
        openInNewTab: false,
    },
)

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

// ===== 虚拟滚动 =====
// Tailwind 断点（min-width）-> 网格列数，需与下方网格 class 对齐：
// grid-cols-2 / md:3 / lg:4 / xl:5 / 2xl:7 / 3xl:9
const BREAKPOINTS: ReadonlyArray<readonly [number, number]> = [
    [1920, 9], // 3xl
    [1536, 7], // 2xl
    [1280, 5], // xl
    [1024, 4], // lg
    [768, 3], // md
    [0, 2], // 默认
]

function getColumnCount(width: number): number {
    for (const [bp, cols] of BREAKPOINTS) {
        if (width >= bp) return cols
    }
    return 2
}

const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const columnCount = computed(() => getColumnCount(viewportWidth.value))

const updateViewport = throttle(() => {
    viewportWidth.value = window.innerWidth
}, 100)

onMounted(() => window.addEventListener('resize', updateViewport, { passive: true }))
onUnmounted(() => {
    window.removeEventListener('resize', updateViewport)
    updateViewport.cancel?.()
})

// 按 columnCount 把一维 items 切成二维行，每行作为一个虚拟化单元
const rows = computed<GalleryItem[][]>(() => {
    const cols = columnCount.value
    const list = props.items
    const result: GalleryItem[][] = []
    for (let i = 0; i < list.length; i += cols) {
        result.push(list.slice(i, i + cols))
    }
    return result
})

// 行高估算：卡片宽 md:w-56.25(≈225px)，封面按 500×706 比例 ≈318px(max-h-80 限 320)，
// 加 mt-2(8px) + 两行标题(≈36px) ≈ 362px。给 380 略大，由 measureElement 动态修正。
const rowVirtualizer = useWindowVirtualizer(
    computed(() => ({
        count: rows.value.length,
        estimateSize: () => 380,
        overscan: 4,
        gap: 24, // 对应 gap-6
    })),
)

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalHeight = computed(() => rowVirtualizer.value.getTotalSize())

function measureRow(el: Element | ComponentPublicInstance | null) {
    if (el instanceof HTMLElement) rowVirtualizer.value.measureElement(el)
}
</script>

<template>
    <!-- 初始加载状态 -->
    <PageLoader v-if="!compact && loading" />

    <!-- 瀑布流 Grid -->
    <div v-if="compact || !loading" class="mx-auto w-fit rounded-xl bg-[#2A3744] px-4 py-6">
        <!--
            幽灵网格：仅用于撑起 w-fit 容器宽度（虚拟行用 absolute 定位会脱离文档流导致容器塌陷）。
            自身 invisible + h-0 overflow-hidden，不占高度、不可见，但宽度与真实网格一致。
            放置最大列数(9)个占位，CSS 断点自动决定显示列数，多余占位被 overflow 裁掉。
        -->
        <div
            aria-hidden="true"
            class="3xl:grid-cols-9 invisible grid h-0 grid-cols-2 justify-center gap-6 overflow-hidden md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7"
        >
            <div v-for="n in 9" :key="n" class="w-full md:w-56.25" style="height: 1px"></div>
        </div>

        <!-- 虚拟滚动容器：总高度撑开，可见行绝对定位 -->
        <div :style="{ position: 'relative', height: `${totalHeight}px`, width: '100%' }">
            <div
                v-for="vRow in virtualRows"
                :key="vRow.index"
                :ref="measureRow"
                :data-index="vRow.index"
                :style="{
                    position: 'absolute',
                    top: '0',
                    left: '0',
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
                        :target="openInNewTab ? '_blank' : undefined"
                    >
                        <!-- 封面图 -->
                        <div
                            :class="[
                                'relative mx-auto max-h-80 overflow-hidden rounded-lg bg-gray-800',
                                'w-full md:w-56.25',
                            ]"
                        >
                            <!--
                                @slot 封面图覆盖层，由父组件控制下载按钮等覆盖内容
                                @binding {GalleryItem} item - 当前条目
                            -->
                            <slot name="overlay" :item="item" />

                            <img
                                :src="getThumbnailUrl(item.thumbnail)"
                                :alt="item.japanese_title || item.english_title"
                                class="h-auto w-full transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
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
