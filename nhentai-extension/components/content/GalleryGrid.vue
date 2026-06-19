<script lang="ts" setup>
import { ref, watch, onUnmounted, useTemplateRef } from 'vue'
import type { IResult } from '@/api/index.d'
import type { ContentMessage } from '@/types/messages.d'
import { handleImageError } from '@/utils/imageFallback'
import MediaService from '@/db/index'
import ConfirmDialog from '@/components/content/ConfirmDialog.vue'
import PageLoader from '@/components/content/PageLoader.vue'
import LoadingSpinner from '@/components/content/LoadingSpinner.vue'
import { LangEnum, MsgTypeEnum } from '@/enums'

function getLangIcon(tagIds: number[]): string | undefined {
    for (const item of LangEnum.items) {
        if (tagIds.includes(item.value)) return item.raw.icon
    }
    return undefined
}

interface IGalleryItem extends IResult {
    _page: number
}

const props = defineProps<{
    items: IGalleryItem[]
    loading?: boolean
    loadingMore?: boolean
    isEnd?: boolean
    emptyText?: string
    compact?: boolean
}>()

const downloadedIds = ref<Set<number>>(new Set())
const downloadProgress = ref<Map<number, number>>(new Map())

// 批量检查 item.id 是否在 IndexedDB 中（监听 length，push 时也能触发）
watch(
    () => props.items.length,
    async () => {
        for (const item of props.items) {
            const id = item.id
            if (downloadedIds.value.has(id)) continue
            if (downloadProgress.value.has(id)) continue
            const exists = await MediaService.hasMedia(id)
            if (exists) {
                downloadedIds.value = new Set([...downloadedIds.value, id])
            }
        }
    },
    { immediate: true },
)

// 监听 background 回传的下载进度
function handleProgressMsg(msg: ContentMessage) {
    if (msg.type === MsgTypeEnum.Progress) {
        downloadProgress.value = new Map([...downloadProgress.value, [msg.id, msg.data]])
    }
    if (msg.type === MsgTypeEnum.Success) {
        MediaService.addMedia(msg.id)
        downloadedIds.value = new Set([...downloadedIds.value, msg.id])
        const next = new Map(downloadProgress.value)
        next.delete(msg.id)
        downloadProgress.value = next
    }
}

browser.runtime.onMessage.addListener(handleProgressMsg)

onUnmounted(() => {
    browser.runtime.onMessage.removeListener(handleProgressMsg)
})

const confirmDialogRef = useTemplateRef('confirmDialogRef')
const confirmingId = ref<number>(0)
const confirmingTitle = ref<string>('')

function askReDownload(item: IGalleryItem) {
    confirmingId.value = item.id
    confirmingTitle.value = item.japanese_title || item.english_title || `#${item.id}`
    confirmDialogRef.value?.show()
}

function onReDownloadConfirm() {
    // 先从已下载集合中移除，让模板 v-if 链走到进度条分支
    const id = confirmingId.value
    const next = new Set(downloadedIds.value)
    next.delete(id)
    downloadedIds.value = next
    handleDownload(id)
}

async function handleDownload(id: number) {
    // 立即显示 0%，不等到 background 回传
    downloadProgress.value = new Map([...downloadProgress.value, [id, 0]])
    // 发送下载请求到 background，由 offscreen 执行实际下载和压缩
    browser.runtime.sendMessage({ type: MsgTypeEnum.Download, id })
}

const removeDialogRef = useTemplateRef('removeDialogRef')
const removingId = ref<number>(0)
const removingTitle = ref<string>('')

function askRemove(item: IGalleryItem) {
    removingId.value = item.id
    removingTitle.value = item.japanese_title || item.english_title || `#${item.id}`
    removeDialogRef.value?.show()
}

async function onRemoveConfirm() {
    const id = removingId.value
    await MediaService.deleteMedia(id)
    const next = new Set(downloadedIds.value)
    next.delete(id)
    downloadedIds.value = next
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
        <div class="grid grid-cols-5 justify-center gap-6">
            <router-link
                v-for="item in items"
                :key="item.id"
                :data-page="item._page"
                :to="{ name: 'Detail', params: { id: item.id } }"
                class="group block text-current"
            >
                <!-- 封面图 -->
                <div class="relative mx-auto max-h-80 w-56.25 overflow-hidden rounded-lg bg-gray-800">
                    <!-- 已下载：绿色勾（点击可重新下载） -->
                    <button
                        v-if="downloadedIds.has(item.id)"
                        class="absolute top-2 left-2 z-10 cursor-pointer rounded border-none bg-green-400 transition-colors hover:bg-green-300"
                        @click.stop.prevent="askReDownload(item)"
                    >
                        <div class="p-2">
                            <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 448 512">
                                <path
                                    d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
                                />
                            </svg>
                        </div>
                    </button>
                    <!-- 已下载：红色删除按钮（hover 显示） -->
                    <button
                        v-if="downloadedIds.has(item.id)"
                        class="absolute top-2 right-2 z-10 cursor-pointer rounded border-none bg-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400"
                        @click.stop.prevent="askRemove(item)"
                    >
                        <div class="p-2">
                            <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 384 512">
                                <path
                                    d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
                                />
                            </svg>
                        </div>
                    </button>
                    <!-- 下载中：百分比 -->
                    <button
                        v-else-if="downloadProgress.has(item.id)"
                        class="absolute top-2 left-2 z-10 cursor-not-allowed rounded border-none bg-yellow-500"
                        @click.stop.prevent
                    >
                        <div class="p-2">
                            <div class="flex h-4 w-4 items-center justify-center">
                                <span class="text-[8px] leading-none font-bold text-white"
                                    >{{ downloadProgress.get(item.id) }}%</span
                                >
                            </div>
                        </div>
                    </button>
                    <!-- 未下载：蓝色下载 -->
                    <button
                        v-else
                        class="absolute top-2 left-2 z-10 cursor-pointer rounded border-none bg-blue-500 hover:bg-blue-300"
                        @click.stop.prevent="handleDownload(item.id)"
                    >
                        <div class="p-2">
                            <svg class="h-4 w-4 fill-current text-white" viewBox="0 0 512 512">
                                <path
                                    d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"
                                />
                            </svg>
                        </div>
                    </button>
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
                    class="mx-auto mt-2 line-clamp-2 flex w-56.25 items-center justify-center gap-1 text-center text-sm text-gray-300 transition-colors group-hover:text-white"
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

    <!-- 重新下载确认弹窗 -->
    <ConfirmDialog ref="confirmDialogRef" :title="confirmingTitle" @confirm="onReDownloadConfirm" />
    <!-- 删除下载确认弹窗 -->
    <ConfirmDialog
        ref="removeDialogRef"
        :title="removingTitle"
        message="已下载。"
        confirm-text="移除"
        @confirm="onRemoveConfirm"
    />
</template>
