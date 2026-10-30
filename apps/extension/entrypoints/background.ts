import { MsgTypeEnum, MsgTargetEnum } from '@nhentai/api'

import type { BackgroundMessage } from '@/src/types/messages'

/** 这些状态代表一次下载已结束，需要清理 tab 映射 */
function isTerminal(type: string): boolean {
    return type === MsgTypeEnum.Success || type === MsgTypeEnum.Error
}

export default defineBackground(() => {
    /** 记录哪个 tab 发起了哪个下载请求（同一画廊重复下载时以最后一次为准） */
    const downloadTabs = new Map<number, number>() // galleryId → tabId

    /**
     * 单例化的 offscreen 创建流程。
     *
     * 连续点两个下载时，两次 `hasDocument()` 可能同时返回 false，从而重复调用
     * `createDocument()` 并抛 "Only a single offscreen document may be created"。
     * 用共享 Promise 保证只创建一次；失败时清空以允许下次重试。
     */
    let offscreenReady: Promise<void> | null = null

    function ensureOffscreen(): Promise<void> {
        offscreenReady ??= (async () => {
            if (await browser.offscreen.hasDocument()) return
            await browser.offscreen.createDocument({
                url: 'offscreen.html',
                reasons: ['DOM_SCRAPING'],
                justification: 'need DOM environment for streamsaver blob creation',
            })
        })().catch((err: unknown) => {
            offscreenReady = null
            throw err
        })

        return offscreenReady
    }

    browser.runtime.onMessage.addListener((msg: BackgroundMessage, sender) => {
        // content script → offscreen：发起下载
        if (msg.type === MsgTypeEnum.Download) {
            const tabId = sender.tab?.id
            if (tabId !== undefined) downloadTabs.set(msg.id, tabId)

            void ensureOffscreen()
                .then(() => browser.runtime.sendMessage({ target: MsgTargetEnum.Offscreen, id: msg.id }))
                .catch((err: unknown) => {
                    console.error('[background] 无法创建 offscreen document', err)
                    if (tabId === undefined) return
                    downloadTabs.delete(msg.id)
                    void browser.tabs
                        .sendMessage(tabId, {
                            type: MsgTypeEnum.Error,
                            id: msg.id,
                            data: `无法启动下载环境：${err instanceof Error ? err.message : String(err)}`,
                        })
                        .catch(() => {})
                })
            return
        }

        // offscreen → content script：进度 / 完成 / 失败
        if (msg.target === MsgTargetEnum.ServiceWorker) {
            const tabId = downloadTabs.get(msg.id)
            if (tabId === undefined) return

            void browser.tabs
                .sendMessage(tabId, { type: msg.type, id: msg.id, data: msg.data })
                // tab 可能已被关闭，忽略即可
                .catch(() => {})
                .finally(() => {
                    if (isTerminal(msg.type)) downloadTabs.delete(msg.id)
                })
        }
    })
})
