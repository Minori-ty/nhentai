import { showConfirm } from '@nhentai/components'
import { provide, inject, type InjectionKey } from 'vue'

/**
 * 注入上下文 —— 子组件通过 `useDownloadDialogs()` 获取这两个方法。
 */
export interface DownloadDialogContext {
    /** 弹出"重新下载"确认框，用户确认后执行 onConfirm */
    showReDownload(title: string, onConfirm: () => void): Promise<void>
    /** 弹出"移除下载"确认框，用户确认后执行 onConfirm */
    showRemove(title: string, onConfirm: () => void): Promise<void>
}

const KEY: InjectionKey<DownloadDialogContext> = Symbol('download-dialog')

/**
 * 在 App.vue 中调用，提供全局共享的 2 个下载确认弹框。
 *
 * @returns 包含 showReDownload / showRemove 方法的上下文
 */
export function provideDownloadDialogs() {
    async function showReDownload(title: string, onConfirm: () => void) {
        const result = await showConfirm({ title })
        if (result) onConfirm()
    }

    async function showRemove(title: string, onConfirm: () => void) {
        const result = await showConfirm({ title, message: '已下载。', confirmText: '移除' })
        if (result) onConfirm()
    }

    provide(KEY, { showReDownload, showRemove })

    return { showReDownload, showRemove }
}

/**
 * 在子组件（DownloadOverlay）中调用，获取弹框方法。
 */
export function useDownloadDialogs(): DownloadDialogContext {
    const ctx = inject(KEY)
    if (!ctx) throw new Error('[useDownloadDialogs] 请在 App.vue 中先调用 provideDownloadDialogs()')
    return ctx
}
