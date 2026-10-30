import { getGalleryInfo, MsgTypeEnum, MsgTargetEnum, type MsgType } from '@nhentai/api'
import { Zip, ZipPassThrough } from 'fflate'
import { createWriteStream } from 'streamsaver'

import type { OffscreenCommand } from '@/src/types/messages'
import { TaskPool } from '@/src/utils/AsyncTaskPool'

/** 图片 CDN 子域，按顺序退避 */
const CDN_ORIGINS = [1, 2, 3, 4].map((n) => `https://i${n}.nhentai.net`)

/**
 * 单页下载超时（毫秒）。
 *
 * 这是**整页**超时，而不是「两个 chunk 之间的间隔」超时——后者会把慢速但正常的
 * 下载误判为失败（3 并发 + 带宽抖动时，任意一次 chunk 间隔超过几秒很常见）。
 */
const PAGE_TIMEOUT = 60_000

/** 同时下载的页数 */
const CONCURRENCY = 3

/** 取扩展名，路径没有扩展名时回退 webp */
function extOf(path: string): string {
    return /\.([a-z0-9]+)$/i.exec(path)?.[1] ?? 'webp'
}

/** Windows / macOS 文件名非法字符 */
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g

/** 清理文件名：去掉控制字符与非法字符，避免 createWriteStream 失败 */
function sanitizeFilename(name: string): string {
    const printable = Array.from(name)
        .filter((char) => {
            const code = char.codePointAt(0) ?? 0
            return code >= 0x20 && code !== 0x7f
        })
        .join('')

    const cleaned = printable.replace(INVALID_FILENAME_CHARS, '_').replace(/\s+/g, ' ').trim().slice(0, 120)
    return cleaned || 'gallery'
}

function toMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
}

/**
 * 中止输出流。
 *
 * 优先用 `abort()`，让浏览器把这次下载标记为「失败」而不是留一个永远停在 50% 的任务；
 * 某些 WritableStream 实现（streamsaver）可能不支持 abort，此时退化为 `close()`，
 * 至少不让下载永远挂着。
 */
async function abortStream(writer: WritableStreamDefaultWriter, reason: unknown): Promise<void> {
    try {
        await writer.abort(reason)
    } catch {
        await writer.close().catch(() => {})
    }
}

/** 向 background 回传状态（background 再转发给对应 tab） */
function notify(type: MsgType, id: number, data?: number | string) {
    browser.runtime.sendMessage({ target: MsgTargetEnum.ServiceWorker, id, type, data }).catch(() => {
        // background 可能随 SW 一起休眠，或 tab 已关闭，静默即可
    })
}

/**
 * 抓取单页图片，按 CDN 子域依次退避。
 *
 * 先完整抓完再交给 zip，好处是：
 * 1. 重试是安全的 —— 不会对同一个 `ZipPassThrough` 执行两次 `zip.add()`；
 * 2. 归档顺序天然正确 —— fflate 的流式 Zip 要求「先 add 后 push」且顺序一致，
 *    边下边写会在慢页上把后续页的数据全量缓冲进内存。
 */
async function fetchPage(path: string): Promise<Uint8Array> {
    let lastError: unknown

    for (const origin of CDN_ORIGINS) {
        try {
            const resp = await fetch(`${origin}/${path}`, { signal: AbortSignal.timeout(PAGE_TIMEOUT) })
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
            return new Uint8Array(await resp.arrayBuffer())
        } catch (err) {
            lastError = err
        }
    }

    throw new Error(`所有 CDN 子域均失败：${toMessage(lastError)}`)
}

/**
 * 下载一本画廊并打包成 ZIP。
 *
 * 任何一页最终失败都会中止整个下载并上报错误：缺页的 ZIP 会让用户误以为拿到了完整本子，
 * 比明确失败更糟。
 */
async function runDownload(id: number): Promise<void> {
    // 注意：offscreen 运行在 chrome-extension:// 源，document.cookie 读不到站点 cookie，
    // 所以这里的 getGalleryInfo 实际不会附带 authorization 头。
    // 该接口匿名即可访问（include=favorite 在未登录时被忽略），图片 CDN 也不需要 token，无需补鉴权。
    const gallery = await getGalleryInfo(id)
    const { pages, title } = gallery
    const total = pages.length
    if (total === 0) throw new Error('该画廊没有可下载的页面')

    const filename = `${sanitizeFilename(title.japanese || title.pretty || String(id))}.zip`
    const fileStream = createWriteStream(filename)
    const writer = fileStream.getWriter()

    /** 是否已中止：中止后不再往归档里写，保证错误只上报一次 */
    let aborted = false
    /** 串行化写入以保持 chunk 顺序；abort 之后写入会 reject，统一吞掉 */
    let writeChain: Promise<unknown> = Promise.resolve()

    const zip = new Zip((error, chunk, final) => {
        if (error) {
            // 打包本身出错：若只打日志，输出流会永远等不到 final 而挂死
            if (aborted) return
            aborted = true
            console.error('[offscreen] zip error', error)
            void abortStream(writer, error)
            notify(MsgTypeEnum.Error, id, `打包失败：${toMessage(error)}`)
            return
        }
        if (chunk) {
            writeChain = writeChain.then(() => writer.write(chunk)).catch(() => {})
        }
        if (final) {
            void writeChain.then(() => writer.close()).catch(() => {})
        }
    })

    const pool = new TaskPool(CONCURRENCY)
    let done = 0

    for (const page of pages) {
        const entry = new ZipPassThrough(`${page.number}.${extOf(page.path)}`)

        pool.add(async () => {
            if (aborted) return
            const data = await fetchPage(page.path)
            // 抓取期间可能已有别的页失败并中止，别再往已关闭的归档里写
            if (aborted) return

            zip.add(entry)
            entry.push(data, true)

            done++
            notify(MsgTypeEnum.Progress, id, Math.floor((done / total) * 100))
        }).catch((err: unknown) => {
            if (aborted) return
            aborted = true
            void abortStream(writer, err)
            notify(MsgTypeEnum.Error, id, `第 ${page.number} 页下载失败：${toMessage(err)}`)
        })
    }

    pool.setOnAllCompleted(() => {
        if (aborted) return
        zip.end()
        notify(MsgTypeEnum.Success, id)
    })
}

browser.runtime.onMessage.addListener((data: OffscreenCommand) => {
    if (data.target !== MsgTargetEnum.Offscreen) return

    void runDownload(data.id).catch((err: unknown) => {
        console.error('[offscreen] download failed', err)
        notify(MsgTypeEnum.Error, data.id, toMessage(err))
    })
})
