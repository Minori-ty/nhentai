import { MsgTypeEnum, MsgTargetEnum } from '@nhentai/shared/enums'

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

/** background → offscreen: 转发下载请求 */
export interface OffscreenCommand {
    target: typeof MsgTargetEnum.Offscreen
    id: number
}

/** offscreen → background: 进度/完成回传 */
export interface OffscreenCallback {
    target: typeof MsgTargetEnum.ServiceWorker
    type: typeof MsgTypeEnum.Progress | typeof MsgTypeEnum.Success
    id: number
    data?: number
}

/** background onMessage 监听的消息联合类型 */
export type BackgroundMessage = DownloadRequest | OffscreenCallback

/** content script onMessage 监听的消息联合类型 */
export type ContentMessage = DownloadProgress | DownloadSuccess
