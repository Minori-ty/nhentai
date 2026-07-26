import { h, render } from 'vue'

import ConfirmDialog from './ConfirmDialog.vue'

export interface ConfirmDialogOptions {
    /** 弹窗标题（展示在警告文案中） */
    title: string
    /** 弹窗描述文案，默认 "已经下载过了。" */
    message?: string
    /** 确认按钮文字，默认 "重新下载" */
    confirmText?: string
}

/**
 * 编程式确认弹窗。
 *
 * 动态创建并挂载 `<ConfirmDialog>`，组件挂载后自动调用 `showModal()` 展示。
 * 返回 Promise<boolean>：
 * - `true`  → 用户点击了确认按钮
 * - `false` → 用户点击了取消按钮或关闭了弹窗（Escape、点击外部等）
 *
 * @example
 * ```ts
 * if (await showConfirm({ title: '确认下载', message: '已经下载过了。' })) {
 *   // 用户确认，执行下载
 * }
 * ```
 */
export function showConfirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
        const container = document.createElement('div')
        container.style.display = 'contents'
        document.body.appendChild(container)

        function cleanup() {
            render(null, container)
            if (container.parentNode) {
                container.parentNode.removeChild(container)
            }
        }

        const vnode = h(ConfirmDialog, {
            title: options.title,
            message: options.message,
            confirmText: options.confirmText,
            autoOpen: true,
            onConfirm: () => {
                cleanup()
                resolve(true)
            },
            onClose: () => {
                cleanup()
                resolve(false)
            },
        })

        render(vnode, container)
    })
}
