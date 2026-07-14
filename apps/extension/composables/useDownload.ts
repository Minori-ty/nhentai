import { ref } from 'vue'

import type { DownloadManager } from '../utils/downloadManager'

let _dm: DownloadManager | null = null
const downloadedIds = ref<Set<number>>(new Set())
const downloadProgress = ref<Map<number, number>>(new Map())

export function initDownload(dm: DownloadManager) {
    _dm = dm
    dm.onProgress((id: number, percent: number, done: boolean) => {
        if (done) {
            dm.addDownload(id)
            downloadedIds.value = new Set([...downloadedIds.value, id])
            const next = new Map(downloadProgress.value)
            next.delete(id)
            downloadProgress.value = next
        } else {
            downloadProgress.value = new Map([...downloadProgress.value, [id, percent]])
        }
    })
}

export function useDownload() {
    return {
        dm: _dm!,
        downloadedIds,
        downloadProgress,
    }
}
