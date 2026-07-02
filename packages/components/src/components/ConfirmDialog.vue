<script lang="ts" setup>
import { useTemplateRef } from 'vue'

import BaseBtn from './BaseBtn.vue'

defineProps<{
    title: string
    message?: string
    confirmText?: string
}>()

const emit = defineEmits<{
    confirm: []
}>()

const dialogRef = useTemplateRef('dialogRef')

function onDialogClose() {
    document.body.style.overflow = ''
}

function show() {
    dialogRef.value?.showModal()
    document.body.style.overflow = 'hidden'
}

function close() {
    dialogRef.value?.close()
}

function onConfirm() {
    emit('confirm')
    close()
}

defineExpose({ show, close })
</script>

<template>
    <Teleport to="body">
        <dialog
            ref="dialogRef"
            closedby="any"
            @close="onDialogClose"
            class="fixed inset-0 m-auto w-96 max-w-[90vw] rounded-2xl border border-gray-700 bg-gray-800 p-0 text-white shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        >
            <div class="flex flex-col items-center gap-5 p-6">
                <!-- 图标 -->
                <div class="flex justify-center">
                    <div class="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/20">
                        <svg class="h-7 w-7 fill-current text-yellow-400" viewBox="0 0 512 512">
                            <path
                                d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
                            />
                        </svg>
                    </div>
                </div>

                <!-- 文字 -->
                <div class="text-center">
                    <p class="text-sm leading-relaxed text-gray-200">
                        <span class="font-semibold text-white">{{ title }}</span
                        >&nbsp;{{ message || '已经下载过了。' }}
                    </p>
                    <p class="mt-1 text-xs text-gray-400">是否{{ confirmText || '重新下载' }}？</p>
                </div>

                <!-- 按钮 -->
                <div class="flex justify-center gap-3">
                    <BaseBtn variant="secondary-outline" size="sm" @click="close">取消</BaseBtn>
                    <BaseBtn variant="danger" size="sm" @click="onConfirm">
                        {{ confirmText || '重新下载' }}
                    </BaseBtn>
                </div>
            </div>
        </dialog>
    </Teleport>
</template>
