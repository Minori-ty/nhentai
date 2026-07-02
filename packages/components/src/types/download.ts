import type { InjectionKey } from 'vue'

export interface DownloadManager {
    isDownloaded(id: number): Promise<boolean>
    startDownload(id: number): void
    addDownload(id: number): Promise<void>
    removeDownload(id: number): Promise<void>
    onProgress(cb: (id: number, percent: number, done: boolean) => void): () => void
}

export const DownloadManagerKey: InjectionKey<DownloadManager> = Symbol('downloadManager')
