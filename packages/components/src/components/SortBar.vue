<script lang="ts" setup>
import { SortEnum, type SortMode } from '@nhentai/api'

/**
 * 排序栏组件。
 *
 * 显示排序按钮行（Recent / Today / Week / All Time），高亮当前选中项。
 * 通过 `update:sort` 事件双向绑定当前排序模式。
 *
 * @event update:sort - 用户切换排序时触发，参数为新的 SortMode
 */
defineProps<{
    /** 当前选中的排序模式 */
    sort: SortMode
    /** 搜索结果总数，显示在排序栏上方 */
    total: number
    /** 结果计数标签文字，默认 "项结果" */
    label?: string
}>()

const emit = defineEmits<{
    /**
     * 更新排序
     */
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
