<script lang="ts" setup>
import { ref, watch, inject, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { userAvatar, userName } from '../composables/useUserAvatar'
import { searchBus } from '../composables/useSearchBus'
import { GridColumnsKey } from '../types/layout'
import BaseBtn from './BaseBtn.vue'
import logoSvg from '../assets/logo.svg'

const emit = defineEmits<{
    search: [query: string]
}>()

const router = useRouter()
const query = ref('')
const isMobile = inject(GridColumnsKey, false)

// 移动端下拉菜单
const menuOpen = ref(false)
const menuRef = useTemplateRef<HTMLElement>('menuRef')

function toggleMenu() {
    menuOpen.value = !menuOpen.value
}

function closeMenu(e: MouseEvent) {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        menuOpen.value = false
    }
}

function goFavorites() {
    query.value = ''
    menuOpen.value = false
    router.push({ name: 'Favorites' })
}

onMounted(() => {
    document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
    document.removeEventListener('click', closeMenu)
})

watch(searchBus, ({ query: q, ts }) => {
    if (ts === 0) return
    query.value = q
})

function doSearch() {
    if (!query.value.trim()) return
    emit('search', query.value.trim())
}
</script>

<template>
    <div class="sticky top-0 z-60 border-b border-gray-600 bg-[#202a34]/95 px-4 py-3 backdrop-blur">
        <div class="mx-auto flex max-w-5xl items-center gap-2">
            <a href="https://nhentai.net/" target="_top" class="mr-1 shrink-0">
                <img :src="logoSvg" alt="nHentai" class="h-8 cursor-pointer transition-opacity hover:opacity-80" />
            </a>
            <input
                v-model="query"
                type="text"
                placeholder="Search galleries..."
                :class="[
                    'flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 transition-all outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50',
                    isMobile ? 'w-38' : '',
                ]"
                @keyup.enter="doSearch"
            />
            <!-- 桌面端：文字按钮；移动端：图标按钮省空间 -->
            <BaseBtn v-if="!isMobile" variant="primary" class="whitespace-nowrap" @click="doSearch">搜索</BaseBtn>
            <button
                v-else
                class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-indigo-500 text-white transition-colors hover:bg-indigo-600"
                @click="doSearch"
            >
                <svg class="h-5 w-5 fill-current" viewBox="0 0 512 512">
                    <path
                        d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208zM208 352a144 144 0 100-288 144 144 0 100 288z"
                    />
                </svg>
            </button>

            <!-- 桌面端：直接显示 Favorites + 头像 + 用户名 -->
            <template v-if="!isMobile">
                <BaseBtn variant="primary-outline" class="whitespace-nowrap" @click="goFavorites">
                    ♥ Favorites
                </BaseBtn>
                <img
                    v-if="userAvatar"
                    :src="userAvatar"
                    alt="avatar"
                    class="h-10 w-10 shrink-0 rounded-full border-2 border-gray-600 transition-colors hover:border-gray-400"
                />
                <span v-if="userName" class="ml-1 text-sm font-medium text-gray-300">{{ userName }}</span>
            </template>

            <!-- 移动端：汉堡菜单按钮 -->
            <div v-else ref="menuRef" class="relative shrink-0">
                <button
                    class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                    @click.stop="toggleMenu"
                >
                    <svg class="h-5 w-5 fill-current" viewBox="0 0 448 512">
                        <path
                            d="M0 96c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32z"
                        />
                    </svg>
                </button>

                <!-- 下拉菜单 -->
                <div
                    v-if="menuOpen"
                    class="absolute top-full right-0 mt-2 flex min-w-44 flex-col gap-3 rounded-xl border border-gray-700 bg-[#2A3744] p-4 shadow-2xl"
                >
                    <!-- Favorites 按钮 -->
                    <BaseBtn variant="primary-outline" class="w-full whitespace-nowrap" @click="goFavorites">
                        ♥ Favorites
                    </BaseBtn>
                    <!-- 头像 + 用户名（独占一行） -->
                    <div v-if="userAvatar || userName" class="flex items-center gap-2">
                        <img
                            v-if="userAvatar"
                            :src="userAvatar"
                            alt="avatar"
                            class="h-10 w-10 shrink-0 rounded-full border-2 border-gray-600"
                        />
                        <span v-if="userName" class="text-sm font-medium text-gray-300">{{ userName }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
