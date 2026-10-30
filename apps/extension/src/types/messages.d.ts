import { MsgTypeEnum, MsgTargetEnum } from '@nhentai/api'

/** content script → background: 发起下载请求 */
export interface DownloadRequest {
    type: typeof MsgTypeEnum.Download
    id: number
}

/** offscreen → background → content: 下载进度 */
export interface DownloadProgress {
    type: typeof MsgTypeEnum.Progress
    id: number
    data: number
}

/** offscreen → background → content: 下载完成 */
export interface DownloadSuccess {
    type: typeof MsgTypeEnum.Success
    id: number
}

/** offscreen → background → content: 下载失败，data 为可读的失败原因 */
export interface DownloadFailed {
    type: typeof MsgTypeEnum.Error
    id: number
    data: string
}

/** background → offscreen: 转发下载请求 */
export interface OffscreenCommand {
    target: typeof MsgTargetEnum.Offscreen
    id: number
}

/** offscreen → background: 进度/完成/失败回传 */
export interface OffscreenCallback {
    target: typeof MsgTargetEnum.ServiceWorker
    type: typeof MsgTypeEnum.Progress | typeof MsgTypeEnum.Success | typeof MsgTypeEnum.Error
    id: number
    data?: number | string
}

/** background onMessage 监听的消息联合类型 */
export type BackgroundMessage = DownloadRequest | OffscreenCallback

/** content script onMessage 监听的消息联合类型 */
export type ContentMessage = DownloadProgress | DownloadSuccess | DownloadFailed
