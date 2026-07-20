import { provide, inject, type InjectionKey, ref } from 'vue'

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
    const reTitle = ref('')
    const rmTitle = ref('')

    let reHandler: (() => void) | null = null
    let rmHandler: (() => void) | null = null

    /** 获取对应 dialog 原生元素 */
    function getDlg(type: 're' | 'rm'): HTMLDialogElement | null {
        const dlgs = document.querySelectorAll<HTMLDialogElement>('body > dialog.fixed')
        // 第二个（index 1）是移除 dialog
        const idx = type === 're' ? 0 : 1
        return dlgs[idx] || null
    }

    function showReDownload(title: string, onConfirm: () => void) {
        reTitle.value = title
        reHandler = onConfirm
        const dlg = getDlg('re')
        if (dlg) {
            document.body.style.overflow = 'hidden'
            dlg.showModal()
        }
    }

    function showRemove(title: string, onConfirm: () => void) {
        rmTitle.value = title
        rmHandler = onConfirm
        const dlg = getDlg('rm')
        if (dlg) {
            document.body.style.overflow = 'hidden'
            dlg.showModal()
        }
    }

    function onReConfirm() {
        reHandler?.()
        reHandler = null
        getDlg('re')?.close()
    }

    function onRmConfirm() {
        rmHandler?.()
        rmHandler = null
        getDlg('rm')?.close()
    }

    provide(KEY, { showReDownload, showRemove })

    return {
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
