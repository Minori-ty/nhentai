<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { userAvatar, userName } from '@/composables/useUserAvatar'
import { searchBus } from '@/composables/useSearchBus'
import BaseBtn from '@/components/content/BaseBtn.vue'

const emit = defineEmits<{
    search: [query: string]
}>()

const router = useRouter()
const query = ref('')

watch(searchBus, ({ query: q, ts }) => {
    if (ts === 0) return
    query.value = q
})

function doSearch() {
    if (!query.value.trim()) return
    emit('search', query.value.trim())
}

function goFavorites() {
    query.value = ''
    router.push({ name: 'Favorites' })
}
</script>

<template>
    <div class="sticky top-0 z-20 border-b border-gray-600 bg-[#202a34]/95 px-4 py-3 backdrop-blur">
        <div class="mx-auto flex max-w-5xl items-center gap-2">
            <a href="https://nhentai.net/" target="_top" class="mr-1 shrink-0">
                <img
                    src="@/assets/logo.svg"
                    alt="nHentai"
                    class="h-8 cursor-pointer transition-opacity hover:opacity-80"
                />
            </a>
            <input
                v-model="query"
                type="text"
                placeholder="Search galleries..."
                class="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 transition-all outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50"
                @keyup.enter="doSearch"
            />
            <BaseBtn variant="primary" class="whitespace-nowrap" @click="doSearch">搜索</BaseBtn>
            <BaseBtn variant="primary-outline" class="whitespace-nowrap" @click="goFavorites"> ♥ Favorites </BaseBtn>
            <img
                v-if="userAvatar"
                :src="userAvatar"
                alt="avatar"
                class="h-10 w-10 shrink-0 rounded-full border-2 border-gray-600 transition-colors hover:border-gray-400"
            />
            <span v-if="userName" class="ml-1 text-sm font-medium text-gray-300">{{ userName }}</span>
        </div>
    </div>
</template>
