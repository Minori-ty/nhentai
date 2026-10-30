import { reactive } from 'vue'

import type { DownloadManager } from '../utils/downloadManager'

let _dm: DownloadManager | null = null

/**
 * 已下载的画廊 id。
 *
 * 用 `reactive(new Set())` 而不是 `ref(new Set())`：原地增删即可精确触发依赖该 key 的组件，
 * 不必每次 `new Set([...old, id])` 全量拷贝（后者会让所有卡片重渲染）。
 */
const downloadedIds = reactive(new Set<number>())

/** 下载进度 0-100，仅「进行中」的画廊有 key */
const downloadProgress = reactive(new Map<number, number>())

/** 最近一次失败原因，key 存在即代表该画廊下载失败 */
const downloadErrors = reactive(new Map<number, string>())

function requireDm(): DownloadManager {
    if (!_dm) throw new Error('[useDownload] 下载管理器尚未初始化，请先在 main() 中调用 initDownload()')
    return _dm
}

/**
 * 初始化下载管理器。应在挂载 Vue 应用之前同步调用。
 */
export function initDownload(dm: DownloadManager) {
    _dm = dm

    dm.onEvent((event) => {
        if (event.type === 'progress') {
            downloadErrors.delete(event.id)
            downloadProgress.set(event.id, event.percent)
            return
        }

        if (event.type === 'success') {
            downloadProgress.delete(event.id)
            downloadErrors.delete(event.id)
            downloadedIds.add(event.id)
            void dm.addDownload(event.id).catch((err: unknown) => {
                console.error('[useDownload] 写入下载记录失败', err)
            })
            return
        }

        // error
        downloadProgress.delete(event.id)
        downloadErrors.set(event.id, event.message)
    })
}

/** 发起下载：清掉旧错误，进度先置 0 让 UI 立刻进入「下载中」 */
function startDownload(id: number) {
    downloadErrors.delete(id)
    downloadProgress.set(id, 0)
    requireDm().startDownload(id)
}

/** 移除下载记录（同时取消进行中的 UI 状态） */
function removeDownload(id: number) {
    void requireDm()
        .removeDownload(id)
        .catch((err: unknown) => {
            console.error('[useDownload] 删除下载记录失败', err)
        })
    downloadedIds.delete(id)
    downloadProgress.delete(id)
    downloadErrors.delete(id)
}

/** 重新下载：先摘掉「已下载」标记，再当普通下载走一遍 */
function reDownload(id: number) {
    downloadedIds.delete(id)
    startDownload(id)
}

export function useDownload() {
    return {
        downloadedIds,
        downloadProgress,
        downloadErrors,
        isDownloaded: (id: number) => downloadedIds.has(id),
        /** 有进度 key 即代表下载中（注意 0% 也算，不能用 `|| 0` 判断） */
        isDownloading: (id: number) => downloadProgress.has(id),
        startDownload,
        removeDownload,
        reDownload,
    }
}

/**
 * 批量检查一组画廊 ID 的下载状态，更新 downloadedIds。
 *
 * 在视图加载条目列表后调用，确保已下载的条目显示绿色标记。
 * 走一次索引批量查询，而不是每个 id 查一次。
 */
export async function batchCheckDownloaded(ids: number[]) {
    const dm = _dm
    if (!dm || ids.length === 0) return

    const pending = ids.filter((id) => !downloadedIds.has(id) && !downloadProgress.has(id))
    if (pending.length === 0) return

    try {
        const found = await dm.getDownloadedIds(pending)
        for (const id of found) downloadedIds.add(id)
    } catch (err) {
        console.error('[useDownload] 批量查询下载状态失败', err)
    }
}
