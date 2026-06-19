<script lang="ts" setup>
withDefaults(
    defineProps<{
        variant?: 'primary' | 'danger' | 'info' | 'success' | 'warning' | 'primary-outline' | 'secondary-outline'
        size?: 'normal' | 'semibold' | 'sm'
        disabled?: boolean
    }>(),
    {
        variant: 'primary',
        size: 'normal',
    },
)
</script>

<template>
    <button
        type="button"
        class="cursor-pointer px-5 py-2 font-medium transition-colors focus:outline-none"
        :class="[
            size === 'sm'
                ? 'rounded-lg text-sm'
                : size === 'semibold'
                  ? 'rounded-md text-base font-semibold'
                  : 'rounded-lg text-base',
            variant === 'primary' ? 'border-none bg-indigo-600 text-white hover:bg-indigo-500' : '',
            variant === 'danger' ? 'border-none bg-[#ed2553] text-white hover:bg-[#ee4972]' : '',
            variant === 'info' ? 'border-none bg-blue-500 text-white hover:bg-blue-300' : '',
            variant === 'success' ? 'border-none bg-green-400 text-white hover:bg-green-300' : '',
            variant === 'warning' ? 'border-none bg-yellow-500 text-white' : '',
            variant === 'primary-outline'
                ? 'border border-pink-600 bg-pink-600/20 text-pink-400 hover:bg-pink-600/30'
                : '',
            variant === 'secondary-outline' ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' : '',
            disabled ? 'cursor-not-allowed opacity-50' : '',
        ]"
        :disabled="disabled"
    >
        <slot />
    </button>
</template>
