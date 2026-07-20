<script lang="ts" setup>
import { type GalleryItem } from '@nhentai/components'

import { useDownloadDialogs } from '../composables/useDownloadDialogs'

/**
 * 画廊封面下载覆盖层组件。
 *
 * 用在 GalleryGrid 的 `#overlay` slot 中，根据下载状态显示三种按钮：
 * - **未下载**：蓝色下载按钮，点击发起下载
 * - **下载中**：黄色百分比标签，不可点击
 * - **已下载**：绿色勾（可点击重新下载）+ 红色×（hover 时显示，可点击移除）
 *
 * 重新下载和移除均会弹出全局 ConfirmDialog（由 App.vue provide）。
 *
 * @slot 无（本组件作为 slot 内容使用，不提供额外 slot）
 *
 * @emits startDownload - 用户点击下载按钮时触发，参数为画廊 ID
 * @emits removeDownload - 用户确认移除下载时触发，参数为画廊 ID
 * @emits reDownload - 用户确认重新下载时触发，参数为画廊 ID
 */
const props = defineProps<{
    /** 当前画廊条目 */
    item: GalleryItem
    /** 已下载的画廊 ID 集合 */
    downloadedIds: Set<number>
    /** 下载进度 Map，key 为画廊 ID，value 为 0-100 百分比 */
    downloadProgress: Map<number, number>
}>()

const emit = defineEmits<{
    /** 发起下载 */
    startDownload: [id: number]
    /** 移除下载记录（已确认） */
    removeDownload: [id: number]
    /** 重新下载（先取消标记再发起下载，已确认） */
    reDownload: [id: number]
}>()

const { showReDownload, showRemove } = useDownloadDialogs()

/** 弹出"重新下载"确认框（使用全局共享 dialog） */
function askReDownload() {
    const title = props.item.japanese_title || props.item.english_title || `#${props.item.id}`
    showReDownload(title, () => {
        emit('reDownload', props.item.id)
    })
}

/** 弹出"移除下载"确认框（使用全局共享 dialog） */
function askRemove() {
    const title = props.item.japanese_title || props.item.english_title || `#${props.item.id}`
    showRemove(title, () => {
        emit('removeDownload', props.item.id)
    })
}

/** 发起下载，触发 startDownload 事件 */
function handleDownload() {
    emit('startDownload', props.item.id)
}
</script>

<template>
    <!-- 已下载：绿色勾 + 红色删除 -->
    <template v-if="downloadedIds.has(item.id)">
        <button
            class="absolute top-2 left-2 z-10 cursor-pointer rounded border-none bg-green-400 transition-colors hover:bg-green-300"
            @click.stop.prevent="askReDownload"
        >
            <div class="p-2">
                <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 448 512">
                    <path
                        d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
                    />
                </svg>
            </div>
        </button>
        <button
            class="absolute top-2 right-2 z-10 cursor-pointer rounded border-none bg-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400"
            @click.stop.prevent="askRemove"
        >
            <div class="p-2">
                <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 384 512">
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
        @click.stop.prevent
    >
        <div class="p-2">
            <div class="flex h-4 w-4 items-center justify-center">
                <span class="text-[8px] leading-none font-bold text-white">{{ downloadProgress.get(item.id) }}%</span>
            </div>
        </div>
    </button>
    <!-- 未下载：蓝色下载按钮 -->
    <button
        v-else
        class="absolute top-2 left-2 z-10 cursor-pointer rounded border-none bg-blue-500 hover:bg-blue-300"
        @click.stop.prevent="handleDownload"
    >
        <div class="p-2">
            <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 512 512">
                <path
                    d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"
                />
            </svg>
        </div>
    </button>
</template>
