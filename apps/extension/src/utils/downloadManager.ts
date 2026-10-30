import { MsgTypeEnum } from '@nhentai/api'

import MediaService from '../db'
import type { ContentMessage } from '../types/messages'

/** 下载过程中 background 回传的事件 */
export type DownloadEvent =
    | { type: 'progress'; id: number; percent: number }
    | { type: 'success'; id: number }
    | { type: 'error'; id: number; message: string }

export interface DownloadManager {
    isDownloaded(id: number): Promise<boolean>
    getDownloadedIds(ids: number[]): Promise<Set<number>>
    startDownload(id: number): void
    addDownload(id: number): Promise<void>
    removeDownload(id: number): Promise<void>
    /** 订阅下载事件，返回取消订阅函数 */
    onEvent(cb: (event: DownloadEvent) => void): () => void
}

export function createDownloadManager(): DownloadManager {
    const listeners = new Set<(event: DownloadEvent) => void>()

    browser.runtime.onMessage.addListener((msg: ContentMessage) => {
        if (msg.type === MsgTypeEnum.Progress) {
            for (const cb of listeners) cb({ type: 'progress', id: msg.id, percent: msg.data })
            return
        }
        if (msg.type === MsgTypeEnum.Success) {
            for (const cb of listeners) cb({ type: 'success', id: msg.id })
            return
        }
        if (msg.type === MsgTypeEnum.Error) {
            for (const cb of listeners) cb({ type: 'error', id: msg.id, message: msg.data })
        }
    })

    return {
        isDownloaded(id: number) {
            return MediaService.hasMedia(id)
        },
        getDownloadedIds(ids: number[]) {
            return MediaService.getDownloadedIds(ids)
        },
        startDownload(id: number) {
            browser.runtime.sendMessage({ type: MsgTypeEnum.Download, id }).catch((err: unknown) => {
                // background 未就绪/被禁用时，让 UI 进入失败态而不是永远停在 0%
                const message = err instanceof Error ? err.message : String(err)
                for (const cb of listeners) cb({ type: 'error', id, message })
            })
        },
        addDownload(id: number) {
            return MediaService.addMedia(id)
        },
        removeDownload(id: number) {
            return MediaService.deleteMedia(id)
        },
        onEvent(cb: (event: DownloadEvent) => void) {
            listeners.add(cb)
            return () => {
                listeners.delete(cb)
            }
        },
    }
}
