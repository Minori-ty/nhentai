<script lang="ts" setup>
import { type GalleryItem } from '@nhentai/components'

import { useDownload } from '../composables/useDownload'
import { useDownloadDialogs } from '../composables/useDownloadDialogs'

/**
 * 画廊封面下载覆盖层组件。
 *
 * 用在 GalleryGrid 的 `#overlay` slot 中，根据下载状态显示四种按钮：
 * - **未下载**：蓝色下载按钮，点击发起下载
 * - **下载中**：黄色百分比标签，不可点击
 * - **已下载**：绿色勾（可点击重新下载）+ 红色×（hover 时显示，可点击移除）
 * - **失败**：红色重试图标，点击重新下载，`title` 显示失败原因
 *
 * 下载状态直接从 `useDownload()` 这个模块级单例读取，不再由父组件透传，
 * 避免每个视图重复写一遍 props 与事件转发。
 *
 * @slot 无（本组件作为 slot 内容使用，不提供额外 slot）
 */
const props = defineProps<{
    /** 当前画廊条目 */
    item: GalleryItem
}>()

const { downloadedIds, downloadProgress, downloadErrors, startDownload, removeDownload, reDownload } = useDownload()
const { showReDownload, showRemove } = useDownloadDialogs()

function itemTitle(): string {
    return props.item.japanese_title || props.item.english_title || `#${props.item.id}`
}

/** 弹出"重新下载"确认框（使用全局共享 dialog） */
function askReDownload() {
    showReDownload(itemTitle(), () => reDownload(props.item.id))
}

/** 弹出"移除下载"确认框（使用全局共享 dialog） */
function askRemove() {
    showRemove(itemTitle(), () => removeDownload(props.item.id))
}
</script>

<template>
    <!-- 失败：红色重试 -->
    <button
        v-if="downloadErrors.has(item.id)"
        class="absolute top-2 left-2 z-10 flex cursor-pointer items-center justify-center rounded border-none bg-red-500 p-2 text-white transition-colors hover:bg-red-400"
        :title="`下载失败：${downloadErrors.get(item.id)}（点击重试）`"
        aria-label="下载失败，点击重试"
        @click.stop.prevent="reDownload(item.id)"
    >
        <svg class="h-4 w-4 fill-current" viewBox="0 0 512 512" aria-hidden="true">
            <path
                d="M463.5 224h8.5c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2S462.4 47 455.4 54L413.6 95.8C369.1 39.4 300.7 3 224 3 100.3 3 0 103.3 0 227c0 123.7 100.3 224 224 224 57.6 0 112.4-21.8 154.2-59.3 9.8-8.8 10.5-24 1.7-33.8s-24-10.5-33.8-1.7C313.9 386 269.9 403 224 403c-97.2 0-176-78.8-176-176S126.8 51 224 51c66.4 0 123.5 37.2 153.4 91.8l-46.2 46.2c-7 7-9.1 17.4-5.4 26.4S338.9 230 348.7 230h114.8z"
            />
        </svg>
    </button>
    <!-- 已下载：绿色勾 + 红色删除 -->
    <template v-else-if="downloadedIds.has(item.id)">
        <button
            class="absolute top-2 left-2 z-10 cursor-pointer rounded border-none bg-green-400 transition-colors hover:bg-green-300"
            title="已下载，点击重新下载"
            aria-label="已下载，点击重新下载"
            @click.stop.prevent="askReDownload"
        >
            <div class="p-2">
                <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 448 512" aria-hidden="true">
                    <path
                        d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
                    />
                </svg>
            </div>
        </button>
        <button
            class="absolute top-2 right-2 z-10 cursor-pointer rounded border-none bg-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400"
            title="移除下载记录"
            aria-label="移除下载记录"
            @click.stop.prevent="askRemove"
        >
            <div class="p-2">
                <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 384 512" aria-hidden="true">
                    <path
                        d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
                    />
                </svg>
            </div>
        </button>
    </template>
    <!-- 下载中：黄色百分比 -->
    <button
        v-else-if="downloadProgress.has(item.id)"
        class="absolute top-2 left-2 z-10 cursor-not-allowed rounded border-none bg-yellow-500"
        :title="`下载中 ${downloadProgress.get(item.id) ?? 0}%`"
        aria-label="下载中"
        @click.stop.prevent
    >
        <div class="p-2">
            <div class="flex h-4 w-4 items-center justify-center">
                <span class="text-[8px] leading-none font-bold text-white"
                    >{{ downloadProgress.get(item.id) ?? 0 }}%</span
                >
            </div>
        </div>
    </button>
    <!-- 未下载：蓝色下载按钮 -->
    <button
        v-else
        class="absolute top-2 left-2 z-10 cursor-pointer rounded border-none bg-blue-500 hover:bg-blue-300"
        title="下载"
        aria-label="下载"
        @click.stop.prevent="startDownload(item.id)"
    >
        <div class="p-2">
            <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 512 512" aria-hidden="true">
                <path
                    d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20-9-20-20 9-20 20-20 20 9 20 20-9 20-20 20zm64 0c0-11-9-20-20-20s-20-9-20-20 9-20 20-20 20 9 20 20-9 20-20 20z"
                />
            </svg>
        </div>
    </button>
</template>
