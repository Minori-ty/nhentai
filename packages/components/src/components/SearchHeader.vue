<script lang="ts" setup>
import { ref, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

import logoSvg from '../assets/logo.svg'
import BaseBtn from './BaseBtn.vue'

/**
 * 顶部搜索栏组件。
 *
 * 包含 logo、搜索输入框、搜索按钮、Favorites 入口和用户头像/名称。
 * 响应式布局：≥1024px(lg) 时按钮+用户信息直接展示，<1024px 时折叠为汉堡菜单。
 *
 * @event search - 用户触发搜索时发出，参数为搜索关键字
 * @event favorites - 用户点击 Favorites 时发出
 */
const props = withDefaults(
    defineProps<{
        /** 搜索输入框的初始值 */
        query?: string
        /** 当前登录用户名，为空时不显示 */
        userName?: string
        /** 当前登录用户头像 URL，为空时不显示 */
        userAvatar?: string
    }>(),
    {
        query: '',
        userName: '',
        userAvatar: '',
    },
)

const emit = defineEmits<{
    /** 用户触发搜索，参数为搜索关键词 */
    search: [query: string]
    /** 用户点击 Favorites 入口 */
    favorites: []
}>()

const inputQuery = ref(props.query)

// 当外部传入的 query 变化时（如 URL 变化），同步到输入框
watch(
    () => props.query,
    (newVal) => {
        inputQuery.value = newVal
    },
)

// 头像 CDN 子域名 fallback（i1 → i4）
const MAX_CDN_RETRY = 4
const avatarSrc = ref(props.userAvatar)
const avatarRetry = ref(0)

watch(
    () => props.userAvatar,
    (newVal) => {
        avatarSrc.value = newVal
        avatarRetry.value = 0
    },
)

/** 头像加载失败时，依次尝试 i1/i2/i3/i4 */
function onAvatarError() {
    if (avatarRetry.value >= MAX_CDN_RETRY - 1) return
    avatarRetry.value++
    const idx = avatarRetry.value + 1 // i2~i4
    avatarSrc.value = props.userAvatar.replace(/\/\/i\d+\.nhentai/, `//i${idx}.nhentai`)
}

// 移动端下拉菜单
const menuOpen = ref(false)
const menuRef = useTemplateRef<HTMLElement>('menuRef')

function toggleMenu() {
    menuOpen.value = !menuOpen.value
}

/** 点击菜单外部区域时关闭下拉菜单 */
function closeMenu(e: MouseEvent) {
    const target = e.target
    if (target instanceof Node) {
        if (menuRef.value && !menuRef.value.contains(target)) {
            menuOpen.value = false
        }
    }
}

/** 窗口拉伸至大屏时自动关闭移动端弹窗 */
function onResize() {
    if (window.innerWidth >= 1024) {
        menuOpen.value = false
    }
}

function goFavorites() {
    inputQuery.value = ''
    menuOpen.value = false
    emit('favorites')
}

onMounted(() => {
    document.addEventListener('click', closeMenu)
    window.addEventListener('resize', onResize)
})

onUnmounted(() => {
    document.removeEventListener('click', closeMenu)
    window.removeEventListener('resize', onResize)
})

function doSearch() {
    if (!inputQuery.value.trim()) return
    emit('search', inputQuery.value.trim())
}
</script>

<template>
    <div class="sticky top-0 z-60 border-b border-gray-600 bg-[#202a34]/95 px-4 py-3 backdrop-blur">
        <div class="mx-auto flex max-w-5xl items-center gap-2">
            <a href="https://nhentai.net/" target="_top" class="mr-1 shrink-0">
                <img :src="logoSvg" alt="nHentai" class="h-8 cursor-pointer transition-opacity hover:opacity-80" />
            </a>
            <input
                v-model="inputQuery"
                type="text"
                placeholder="搜索本子..."
                class="w-38 flex-1 rounded-lg border! border-gray-700! bg-gray-800! px-4 py-2 text-white! placeholder-gray-400 transition-all outline-none focus:border-indigo-400! focus:ring-2! focus:ring-indigo-500/50! lg:w-auto"
                @keyup.enter="doSearch"
            />
            <!-- 大屏：文字搜索按钮 -->
            <BaseBtn variant="primary" class="whitespace-nowrap max-lg:hidden lg:inline-flex" @click="doSearch"
                >搜索</BaseBtn
            >
            <!-- 小屏：图标搜索按钮 -->
            <button
                class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-indigo-500 text-white transition-colors hover:bg-indigo-600 lg:hidden"
                @click="doSearch"
            >
                <svg class="h-5 w-5 fill-current" viewBox="0 0 512 512">
                    <path
                        d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208zM208 352a144 144 0 100-288 144 144 0 100 288z"
                    />
                </svg>
            </button>

            <!-- 大屏：直接显示 Favorites + 头像 + 用户名 -->
            <div class="shrink-0 items-center gap-6 max-lg:hidden lg:flex">
                <BaseBtn variant="primary-outline" class="whitespace-nowrap" @click="goFavorites">
                    ♥ Favorites
                </BaseBtn>
                <img
                    v-if="userAvatar"
                    :src="avatarSrc"
                    alt="avatar"
                    class="h-10 w-10 shrink-0 rounded-full border-2 border-gray-600 transition-colors hover:border-gray-400"
                    @error="onAvatarError"
                />
                <span v-if="userName" class="text-sm font-medium text-gray-300">{{ userName }}</span>
            </div>

            <!-- 小屏：汉堡菜单按钮 -->
            <div ref="menuRef" class="relative shrink-0 lg:hidden">
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
                            :src="avatarSrc"
                            alt="avatar"
                            class="h-10 w-10 shrink-0 rounded-full border-2 border-gray-600"
                            @error="onAvatarError"
                        />
                        <span v-if="userName" class="text-sm font-medium text-gray-300">{{ userName }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
