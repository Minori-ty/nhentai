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

/**
 * 批量检查一组画廊 ID 的下载状态，更新 downloadedIds。
 * 在视图加载条目列表后调用，确保已下载的条目显示绿色标记。
 */
export async function batchCheckDownloaded(ids: number[]) {
    if (!_dm) return
    const pending = ids.filter((id) => !downloadedIds.value.has(id) && !downloadProgress.value.has(id))
    if (pending.length === 0) return
    const checkPromises = pending.map((id) => _dm!.isDownloaded(id).then((ok) => (ok ? id : null)))
    const found = (await Promise.all(checkPromises)).filter(Boolean) as number[]
    if (found.length > 0) {
        downloadedIds.value = new Set([...downloadedIds.value, ...found])
    }
}
