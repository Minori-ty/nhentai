<script lang="ts" setup>
import { getGalleryInfo, favoriteGallery } from '@nhentai/shared/api'
import type { IGallery, Tag } from '@nhentai/shared/api/info.d'
import BaseBtn from '@nhentai/shared/components/BaseBtn.vue'
import PageLoader from '@nhentai/shared/components/PageLoader.vue'
import { TagTypeEnum, LangEnum } from '@nhentai/shared/enums'
import { DownloadManagerKey } from '@nhentai/shared/types/download'
import { GridColumnsKey } from '@nhentai/shared/types/layout'
import { handleImageError } from '@nhentai/shared/utils/imageFallback'
import { intervalToDuration, format } from 'date-fns'
import { ref, onMounted, onUnmounted, inject, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const gallery = ref<IGallery | null>(null)
const loading = ref(true)

const dm = inject(DownloadManagerKey, null)
const isMobile = inject(GridColumnsKey, false)
const thumbGridClass = isMobile ? 'grid-cols-2' : 'grid-cols-5'

const groupedTags = computed(() => {
    if (!gallery.value) return []
    return TagTypeEnum.items
        .map((item) => ({
            label: item.label,
            tags: gallery.value!.tags.filter((t) => t.type === item.value),
        }))
        .filter((g) => g.tags.length > 0)
})

const langIcon = computed(() => {
    if (!gallery.value) return undefined
    for (const tag of gallery.value.tags) {
        if (tag.type !== 'language') continue
        const item = LangEnum.findBy('value', tag.id)
        if (item) return item.raw.icon
    }
    return undefined
})

const coverUrl = computed(() => {
    if (!gallery.value) return ''
    return `https://t1.nhentai.net/${gallery.value.cover.path}`
})

const uploadDate = computed(() => {
    if (!gallery.value) return ''
    const date = new Date(gallery.value.upload_date * 1000)
    const d = intervalToDuration({ start: date, end: new Date() })
    let relative: string
    if (d.years) {
        relative = `${d.years}年前`
        if (d.months) relative = `${d.years}年${d.months}个月前`
    } else if (d.months) {
        relative = `${d.months}个月前`
        if (d.days) relative = `${d.months}个月${d.days}天前`
    } else if (d.days) {
        relative = `${d.days}天前`
        if (d.hours) relative = `${d.days}天${d.hours}小时前`
    } else if (d.hours) {
        relative = `${d.hours}小时前`
        if (d.minutes) relative = `${d.hours}小时${d.minutes}分钟前`
    } else if (d.minutes) {
        relative = `${d.minutes}分钟前`
        if (d.seconds) relative = `${d.minutes}分钟${d.seconds}秒前`
    } else {
        relative = '刚刚'
    }
    const absolute = format(date, 'yyyy/M/d')
    return `${relative} (${absolute})`
})

function formatCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toLocaleString()
}

const favoriting = ref(false)

async function toggleFavorite() {
    if (!gallery.value || favoriting.value) return
    favoriting.value = true
    try {
        const res = await favoriteGallery(gallery.value.id, !gallery.value.is_favorited)
        gallery.value.is_favorited = res.favorited
        gallery.value.num_favorites = res.num_favorites
    } finally {
        favoriting.value = false
    }
}

// 下载相关
const downloaded = ref(false)
const downloadProgress = ref(0)

if (dm) {
    const unsubscribe = dm.onProgress((id, percent, done) => {
        if (id !== gallery.value?.id) return
        if (done) {
            dm.addDownload(id)
            downloaded.value = true
            downloadProgress.value = 0
        } else {
            downloadProgress.value = percent
        }
    })

    onUnmounted(() => {
        unsubscribe()
    })
}

async function handleDownload() {
    if (!gallery.value || !dm) return
    const id = gallery.value.id
    downloadProgress.value = 0
    dm.startDownload(id)
}

function goTag(tag: Tag) {
    const route = TagTypeEnum.findBy('value', tag.type)?.raw.route
    if (route) router.push({ name: route, params: { [tag.type]: tag.slug } })
}

function goSingle() {
    router.push({ name: 'Single', params: { id: route.params.id } })
}

onMounted(async () => {
    const id = Number(route.params.id)
    try {
        gallery.value = await getGalleryInfo(id)
        if (dm) {
            downloaded.value = await dm.isDownloaded(id)
        }
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <!-- 加载中 -->
    <PageLoader v-if="loading" />

    <!-- Detail 内容 -->
    <template v-else-if="gallery">
        <!-- ===== 上半部分：移动端上下布局 / 桌面端左右布局 ===== -->
        <div
            :class="[
                'mx-auto mb-6 flex max-w-[1110px] rounded-xl bg-[#2A3744]',
                isMobile ? 'flex-col items-center gap-4 px-4 py-6' : 'gap-8 px-6 py-8',
            ]"
        >
            <!-- 左边（移动端：上方）封面 -->
            <div class="shrink-0">
                <img
                    :src="coverUrl"
                    :alt="gallery.title.japanese || gallery.title.english"
                    :class="['rounded-lg shadow-lg', isMobile ? 'w-full' : 'w-86']"
                    @error="handleImageError"
                />
            </div>

            <!-- 右边（移动端：下方）信息 -->
            <div class="flex min-w-0 flex-col gap-4">
                <!-- 标题 -->
                <h1 class="flex items-center gap-3 text-3xl leading-snug font-bold text-white">
                    <img v-if="langIcon" :src="langIcon" class="rounded-0.5 h-7 w-7 shrink-0" />
                    {{ gallery.title.japanese || gallery.title.english || gallery.title.pretty }}
                </h1>

                <!-- 信息行：Tags / Artists / Groups / Pages / Uploaded -->
                <div class="flex flex-col gap-3 text-lg">
                    <!-- Tag 分组 -->
                    <div v-for="group in groupedTags" :key="group.label" class="flex items-start gap-4">
                        <span class="w-28 shrink-0 text-right text-gray-400">{{ group.label }}:</span>
                        <div class="flex flex-wrap gap-1">
                            <span
                                v-for="tag in group.tags"
                                :key="tag.id"
                                class="cursor-pointer rounded bg-gray-800 px-2 py-0.5 text-base text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                                @click="goTag(tag)"
                            >
                                {{ tag.name }}
                                <span class="ml-1 text-sm text-gray-500">{{ formatCount(tag.count) }}</span>
                            </span>
                        </div>
                    </div>

                    <!-- Pages -->
                    <div class="flex items-center gap-4">
                        <span class="w-28 shrink-0 text-right text-gray-400">Pages:</span>
                        <span class="text-gray-300">{{ gallery.num_pages }}</span>
                    </div>

                    <!-- Uploaded -->
                    <div class="flex items-center gap-4">
                        <span class="w-28 shrink-0 text-right text-gray-400">Uploaded:</span>
                        <span class="text-gray-300">{{ uploadDate }}</span>
                    </div>
                </div>

                <!-- 按钮组 -->
                <div class="mt-2 flex items-center gap-3 self-start">
                    <!-- Favorite 按钮 -->
                    <BaseBtn variant="danger" size="semibold" :disabled="favoriting" @click="toggleFavorite">
                        {{ gallery.is_favorited ? '♥ Unfavorite' : '♡ Favorite' }}
                        ({{ (gallery.num_favorites ?? 0).toLocaleString() }})
                    </BaseBtn>

                    <!-- 下载按钮 -->
                    <BaseBtn
                        v-if="dm && !downloaded && !downloadProgress"
                        variant="info"
                        size="semibold"
                        @click="handleDownload"
                    >
                        <svg class="inline-block h-5 w-5 fill-current align-middle" viewBox="0 0 512 512">
                            <path
                                d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"
                            />
                        </svg>
                        下载
                    </BaseBtn>
                    <!-- 下载中：百分比 -->
                    <BaseBtn
                        v-if="dm && downloadProgress > 0 && downloadProgress < 100"
                        variant="warning"
                        size="semibold"
                        disabled
                    >
                        下载中 {{ downloadProgress }}%
                    </BaseBtn>
                    <!-- 已下载 -->
                    <span
                        v-if="dm && downloaded && !downloadProgress"
                        class="rounded-md bg-green-400 px-5 py-2 text-base font-semibold text-white"
                    >
                        ✓ 已下载
                    </span>

                    <!-- 滚动预览 -->
                    <BaseBtn variant="success" size="semibold" @click="goSingle">
                        <svg class="inline-block h-5 w-5 fill-current align-middle" viewBox="0 0 448 512">
                            <path
                                d="M96 0C43 0 0 43 0 96v320c0 53 43 96 96 96h320c17.7 0 32-14.3 32-32s-14.3-32-32-32v-64c17.7 0 32-14.3 32-32V32c0-17.7-14.3-32-32-32H96zm0 384h256v64H96c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16h192c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16zm16 48h192c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16s7.2-16 16-16z"
                            />
                        </svg>
                        滚动预览
                    </BaseBtn>
                </div>
            </div>
        </div>

        <!-- ===== 下半部分：所有漫画缩略图 ===== -->
        <div class="mx-auto w-fit rounded-xl bg-[#2A3744] px-6 py-6">
            <div :class="['grid justify-center gap-6', thumbGridClass]">
                <div v-for="page in gallery.pages" :key="page.number" class="group">
                    <div
                        :class="[
                            'mx-auto h-80 overflow-hidden rounded-lg bg-gray-800',
                            isMobile ? 'w-full' : 'w-56.25',
                        ]"
                    >
                        <img
                            :src="`https://t1.nhentai.net/${page.thumbnail}`"
                            :alt="`Page ${page.number}`"
                            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                            @error="handleImageError"
                        />
                    </div>
                    <p :class="['mx-auto mt-2 text-center text-sm text-gray-400', isMobile ? 'w-full' : 'w-56.25']">
                        #{{ page.number }}
                    </p>
                </div>
            </div>
        </div>
    </template>
</template>
