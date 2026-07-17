import { MsgTypeEnum } from '@nhentai/api'

import MediaService from '../db'
import type { ContentMessage } from '../types/messages'

export interface DownloadManager {
    isDownloaded(id: number): Promise<boolean>
    startDownload(id: number): void
    addDownload(id: number): Promise<void>
    removeDownload(id: number): Promise<void>
    onProgress(cb: (id: number, percent: number, done: boolean) => void): () => void
}

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
