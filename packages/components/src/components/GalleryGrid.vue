<script lang="ts" setup>
import type { IResult } from '@nhentai/api'
import { handleImageError } from '@nhentai/utils'

import { LangEnum } from '../enums'
import LoadingSpinner from './LoadingSpinner.vue'
import PageLoader from './PageLoader.vue'

export interface GalleryItem extends IResult {
    _page: number
}

const props = withDefaults(
    defineProps<{
        items: GalleryItem[]
        loading?: boolean
        loadingMore?: boolean
        isEnd?: boolean
        emptyText?: string
        compact?: boolean
        openInNewTab?: boolean
    }>(),
    {
        openInNewTab: false,
    },
)

function getLangIcon(tagIds: number[]): string | undefined {
    for (const item of LangEnum.items) {
        if (tagIds.includes(item.value)) return item.raw.icon
    }
    return undefined
}

function getThumbnailUrl(thumbnail: string): string {
    return `https://t1.nhentai.net/${thumbnail}`
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
                :target="openInNewTab ? '_blank' : undefined"
            >
                <!-- 封面图 -->
                <div :class="['relative mx-auto max-h-80 overflow-hidden rounded-lg bg-gray-800', 'w-full md:w-56.25']">
                    <!-- overlay slot：由父组件控制下载按钮等覆盖内容 -->
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
