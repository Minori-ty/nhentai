<script lang="ts" setup>
import type { IResult } from '@nhentai/api'
import { handleImageError } from '@nhentai/utils'
import { ref } from 'vue'

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

/** 缩略图尺寸缺失时的兜底比例（nhentai 标准封面 250×353） */
const FALLBACK_THUMBNAIL = { width: 250, height: 353 }

/**
 * 封面盒的 `aspect-ratio` 值，由缩略图数据推导而非等图片加载后撑开。
 *
 * nhentai 的缩略图有三类比例（约 250×353 竖版、250×250 方版、250×188 横版），
 * 高度相差最多约 130px。若占位阶段统一用固定高度，图片加载完成时整行高度会突变，
 * 造成下方内容向上跳动。用 `aspect-ratio` 让占位尺寸一开始就等于最终尺寸。
 * 配合 `max-h-80`，最终高度与原 `h-auto` + `max-h-80` 完全一致。
 */
function coverAspectRatio(item: GalleryItem): string {
    const { thumbnail_width, thumbnail_height } = item
    const { width, height } =
        thumbnail_width > 0 && thumbnail_height > 0
            ? { width: thumbnail_width, height: thumbnail_height }
            : FALLBACK_THUMBNAIL
    return `${width} / ${height}`
}

/** 已加载图片的 ID 集合，rAF 延迟更新确保 placeholder 至少渲染一帧 */
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

    <!-- 瀑布流 Grid -->
    <div v-if="compact || !loading" class="mx-auto w-fit rounded-xl bg-[#2A3744] px-4 py-6">
        <div
            class="3xl:grid-cols-9 grid grid-cols-2 justify-center gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7"
        >
            <router-link
                v-for="item in items"
                :key="item.id"
                :data-page="item._page"
                :to="{ name: 'Detail', params: { id: item.id } }"
                class="group block text-current"
            >
                <!-- 封面图 -->
                <div
                    :class="['relative mx-auto max-h-80 overflow-hidden rounded-lg bg-gray-800', 'w-full md:w-56.25']"
                    :style="{ aspectRatio: coverAspectRatio(item) }"
                >
                    <!-- shimmer placeholder -->
                    <div
                        v-show="!loadedImageIds.has(item.id)"
                        class="animate-shimmer pointer-events-none absolute inset-0 z-10"
                    />
                    <!--
                        @slot 封面图覆盖层，由父组件控制下载按钮等覆盖内容
                        @binding {GalleryItem} item - 当前条目
                    -->
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
                    漫画名：`line-clamp-2` 的 `display: -webkit-box` 会被 `flex` 覆盖，
                    故不用 flex 居中，改为文字 `text-center` +
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
