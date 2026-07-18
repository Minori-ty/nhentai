<script lang="ts" setup>
/**
 * 429 请求限流重试倒计时条。
 *
 * 当 `retryCountdown > 0` 时，在页面底部 fixed 显示黄色倒计时提示条，
 * 告知用户等待 N 秒后自动重试。
 */
defineProps<{
    /** 剩余重试秒数（0 表示不显示） */
    retryCountdown: number
}>()
</script>

<template>
    <div
        v-if="retryCountdown > 0"
        class="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center gap-2 bg-yellow-600 px-4 py-2 text-sm text-white"
    >
        <span>请求过于频繁，</span>
        <span class="inline-block min-w-[3ch] text-center font-mono font-bold">{{ retryCountdown }}</span>
        <span>秒后重试</span>
    </div>
</template>
