import { provide, inject, type InjectionKey, ref, nextTick } from 'vue'

/**
 * ConfirmDialog 暴露的组件方法接口。
 */
export interface DialogHandle {
    show(): void
    close(): void
}

/**
 * 注入上下文 —— 子组件通过 `useDownloadDialogs()` 获取这两个方法。
 */
export interface DownloadDialogContext {
    /** 弹出"重新下载"确认框，用户确认后执行 onConfirm */
    showReDownload(title: string, onConfirm: () => void): void
    /** 弹出"移除下载"确认框，用户确认后执行 onConfirm */
    showRemove(title: string, onConfirm: () => void): void
}

const KEY: InjectionKey<DownloadDialogContext> = Symbol('download-dialog')

/**
 * 在 App.vue 中调用，提供全局共享的 2 个下载确认弹框。
 *
 * @returns 专供 App.vue 绑定的响应式值和事件回调
 *
 * @example
 * ```vue
 * <ConfirmDialog ref="reRef" :title="reTitle" @confirm="onReConfirm" />
 * <ConfirmDialog ref="rmRef"  :title="rmTitle" message="已下载。" confirm-text="移除" @confirm="onRmConfirm" />
 * ```
 */
export function provideDownloadDialogs() {
    const reRef = ref<DialogHandle | null>(null)
    const rmRef = ref<DialogHandle | null>(null)
    const reTitle = ref('')
    const rmTitle = ref('')

    let reHandler: (() => void) | null = null
    let rmHandler: (() => void) | null = null

    function showReDownload(title: string, onConfirm: () => void) {
        reTitle.value = title
        reHandler = onConfirm
        nextTick(() => reRef.value?.show())
    }

    function showRemove(title: string, onConfirm: () => void) {
        rmTitle.value = title
        rmHandler = onConfirm
        nextTick(() => rmRef.value?.show())
    }

    function onReConfirm() {
        reHandler?.()
        reHandler = null
    }

    function onRmConfirm() {
        rmHandler?.()
        rmHandler = null
    }

    provide(KEY, { showReDownload, showRemove })

    return {
        reRef,
        rmRef,
        reTitle,
        rmTitle,
        onReConfirm,
        onRmConfirm,
    }
}

/**
 * 在子组件（DownloadOverlay）中调用，获取弹框方法。
 */
export function useDownloadDialogs(): DownloadDialogContext {
    const ctx = inject(KEY)
    if (!ctx) throw new Error('[useDownloadDialogs] 请在 App.vue 中先调用 provideDownloadDialogs()')
    return ctx
}
