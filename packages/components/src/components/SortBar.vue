<script lang="ts" setup>
import { SortEnum, type SortMode } from '../enums'

defineProps<{
    sort: SortMode
    total: number
    label?: string
}>()

const emit = defineEmits<{
    'update:sort': [mode: SortMode]
}>()

function setSort(mode: SortMode) {
    emit('update:sort', mode)
}
</script>

<template>
    <div class="mx-auto max-w-5xl space-y-3 px-4 py-4 text-center">
        <p class="text-2xl text-gray-400">
            共 <span class="font-semibold text-white">{{ total.toLocaleString() }}</span> {{ label || '项结果' }}
        </p>
        <div class="flex items-center justify-center gap-2">
            <button
                v-for="opt in SortEnum.items"
                :key="opt.value"
                type="button"
                class="cursor-pointer rounded-lg border-none px-5 py-2 text-base font-medium transition-colors"
                :class="
                    sort === opt.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                "
                @click="setSort(opt.value)"
            >
                {{ opt.label }}
            </button>
        </div>
    </div>
</template>
