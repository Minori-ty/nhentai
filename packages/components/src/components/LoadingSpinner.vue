<script lang="ts" setup>
/**
 * 加载旋转动画组件。
 *
 * 纯 CSS 旋转动画，提供 sm（小）和 lg（大）两种尺寸。
 */
defineProps<{
    /** 尺寸：sm（h-6 w-6）/ lg（h-8 w-8），默认 lg */
    size?: 'sm' | 'lg'
}>()
</script>

<template>
    <div
        class="animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"
        :class="size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'"
    />
</template>
