<script lang="ts" setup>
import { Heart } from '@lucide/vue'
import { getGalleryInfo, favoriteGallery } from '@nhentai/api'
import type { IGallery, Tag } from '@nhentai/api'
import { TagTypeEnum } from '@nhentai/api'
import { LangEnum, BaseBtn, PageLoader } from '@nhentai/components'
import { handleImageError } from '@nhentai/utils'
import { intervalToDuration, format } from 'date-fns'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute<'Detail'>()
const router = useRouter()
const gallery = ref<IGallery | null>(null)
const loading = ref(true)

const groupedTags = computed(() => {
    if (!gallery.value) return []
    const { tags } = gallery.value
    return TagTypeEnum.items
        .map((item) => ({
            label: item.label,
            tags: tags.filter((t) => t.type === item.value),
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

function goTag(tag: Tag) {
    for (const item of TagTypeEnum.items) {
        if (item.value === tag.type) {
            router.push({ name: item.raw.route, params: { name: tag.slug } })
            return
        }
    }
}

function goSingle(page?: number) {
    router.push({ name: 'Single', params: { id: route.params.id }, query: page ? { page } : undefined })
}

// 监听路由参数变化，支持 KeepAlive 下切换不同 gallery
watch(
    () => route.params.id,
    (newId) => {
        const id = Number(newId)
        if (!Number.isFinite(id)) return
        loading.value = true
        gallery.value = null
        getGalleryInfo(id)
            .then((g) => (gallery.value = g))
            .finally(() => (loading.value = false))
    },
    { immediate: true },
)
</script>

<template>
    <!-- 加载中 -->
    <PageLoader v-if="loading" />

    <!-- Detail 内容 -->
    <template v-else-if="gallery">
        <div
            class="detail-top mx-auto mt-4 mb-6 flex max-w-[1110px] flex-col items-center rounded-xl bg-[#2A3744] px-4 py-6"
        >
            <div class="shrink-0">
                <img
                    :src="coverUrl"
                    :alt="gallery.title.japanese || gallery.title.english"
                    :class="['rounded-lg shadow-lg', 'w-84']"
                    @error="handleImageError"
                />
            </div>

            <div class="flex min-w-0 flex-col gap-4">
                <h1 class="flex items-center gap-3 text-3xl leading-snug font-bold text-white">
                    <img v-if="langIcon" :src="langIcon" class="rounded-0.5 h-7 w-7 shrink-0" />
                    {{ gallery.title.japanese || gallery.title.english || gallery.title.pretty }}
                </h1>

                <div class="flex flex-col gap-3 text-lg">
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

                    <div class="flex items-center gap-4">
                        <span class="w-28 shrink-0 text-right text-gray-400">Pages:</span>
                        <span class="text-gray-300">{{ gallery.num_pages }}</span>
                    </div>

                    <div class="flex items-center gap-4">
                        <span class="w-28 shrink-0 text-right text-gray-400">Uploaded:</span>
                        <span class="text-gray-300">{{ uploadDate }}</span>
                    </div>
                </div>

                <div class="mt-2 flex items-center gap-3 self-start">
                    <BaseBtn variant="danger" size="semibold" :disabled="favoriting" @click="toggleFavorite">
                        <span class="inline-flex items-center gap-1">
                            <Heart :fill="gallery.is_favorited ? 'currentColor' : 'none'" class="h-5 w-5" />
                            {{ gallery.is_favorited ? 'Unfavorite' : 'Favorite' }}
                            ({{ (gallery.num_favorites ?? 0).toLocaleString() }})
                        </span>
                    </BaseBtn>

                    <BaseBtn variant="success" size="semibold" @click="goSingle()">
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

        <div class="mx-auto w-fit rounded-xl bg-[#2A3744] px-6 py-6">
            <div
                class="3xl:grid-cols-9 grid grid-cols-2 justify-center gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7"
            >
                <div
                    v-for="page in gallery.pages"
                    :key="page.number"
                    class="group w-full cursor-pointer"
                    @click="goSingle(page.number)"
                >
                    <div :class="['mx-auto h-80 overflow-hidden rounded-lg bg-gray-800', 'w-full md:w-56.25']">
                        <img
                            :src="`https://t1.nhentai.net/${page.thumbnail}`"
                            :alt="`Page ${page.number}`"
                            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                            @error="handleImageError"
                        />
                    </div>
                    <p :class="['mx-auto mt-2 text-center text-sm text-gray-400', 'w-full md:w-56.25']">
                        #{{ page.number }}
                    </p>
                </div>
            </div>
        </div>
    </template>
</template>

<style scoped>
@media (width >= 64rem) {
    .detail-top {
        flex-direction: row;
        gap: 2rem;
        padding-inline: 1.5rem;
        padding-block: 2rem;
    }
}
</style>
