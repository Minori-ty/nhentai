import type { BackgroundMessage } from '@/types/messages.d'
import { MsgTypeEnum, MsgTargetEnum } from '@nhentai/shared/enums'

export default defineBackground(() => {
    // 记录哪个 tab 发起了哪个下载请求
    const downloadTabs = new Map<number, number>() // galleryId → tabId

    async function ensureOffscreen() {
        const existing = await browser.offscreen.hasDocument()
        if (existing) return
        await browser.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['DOM_SCRAPING'],
            justification: 'need DOM environment for streamsaver blob creation',
        })
    }

    ensureOffscreen()

    browser.runtime.onMessage.addListener((msg: BackgroundMessage, sender) => {
        // content script → offscreen：发起下载
        if (msg.type === MsgTypeEnum.Download) {
            if (sender.tab?.id) {
                downloadTabs.set(msg.id, sender.tab.id)
            }
            ensureOffscreen().then(() => {
                browser.runtime.sendMessage({ target: MsgTargetEnum.Offscreen, id: msg.id })
            })
            return
        }

        // offscreen → content script：进度 / 完成
        if (msg.target === MsgTargetEnum.ServiceWorker) {
            const tabId = downloadTabs.get(msg.id)
            if (!tabId) return

            browser.tabs.sendMessage(tabId, {
                type: msg.type,
                id: msg.id,
                data: msg.data,
            })

            if (msg.type === MsgTypeEnum.Success) {
                downloadTabs.delete(msg.id)
            }
        }
    })
})
