import { MsgTypeEnum } from '@nhentai/shared/enums'
import type { DownloadManager } from '@nhentai/shared/types/download'

import MediaService from '../db'
import type { ContentMessage } from '../types/messages.d'

export function createDownloadManager(): DownloadManager {
    const listeners = new Set<(id: number, percent: number, done: boolean) => void>()

    browser.runtime.onMessage.addListener((msg: ContentMessage) => {
        for (const cb of listeners) {
            if (msg.type === MsgTypeEnum.Progress) {
                cb(msg.id, msg.data, false)
            }
            if (msg.type === MsgTypeEnum.Success) {
                cb(msg.id, 100, true)
            }
        }
    })

    return {
        async isDownloaded(id: number) {
            return MediaService.hasMedia(id)
        },
        startDownload(id: number) {
            browser.runtime.sendMessage({ type: MsgTypeEnum.Download, id })
        },
        async addDownload(id: number) {
            await MediaService.addMedia(id)
        },
        async removeDownload(id: number) {
            await MediaService.deleteMedia(id)
        },
        onProgress(cb: (id: number, percent: number, done: boolean) => void) {
            listeners.add(cb)
            return () => {
                listeners.delete(cb)
            }
        },
    }
}
