<script lang="ts" setup>
defineProps<{
    size?: 'sm' | 'lg'
}>()
</script>

<template>
    <div
        class="animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"
        :class="size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'"
    />
</template>
