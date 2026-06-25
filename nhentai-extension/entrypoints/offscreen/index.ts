import { getGalleryInfo } from '@nhentai/shared/api'
import { MsgTypeEnum, MsgTargetEnum } from '@nhentai/shared/enums'
import { Zip, ZipPassThrough } from 'fflate'
import { createWriteStream } from 'streamsaver'

import type { OffscreenCommand } from '@/types/messages.d'
import { TaskPool } from '@/utils/AsyncTaskPool'

browser.runtime.onMessage.addListener(async (data: OffscreenCommand) => {
    if (data.target !== MsgTargetEnum.Offscreen) return

    try {
        const gallery = await getGalleryInfo(data.id)
        const { pages, title } = gallery
        const total = pages.length
        let count = 0

        const fileStream = createWriteStream(`${title.japanese || title.pretty || data.id}.zip`)
        const writer = fileStream.getWriter()

        const zip = new Zip((_error, chunk, final) => {
            if (chunk) writer.write(chunk)
            if (final) writer.close()
        })

        const pool = new TaskPool(3)

        function downloadPage(url: string, pt: ZipPassThrough) {
            return new Promise<void>((resolve, reject) => {
                const run = async () => {
                    try {
                        zip.add(pt)

                        const resp = await fetch(url)
                        if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`)

                        const reader = resp.body?.getReader()
                        if (!reader) {
                            pt.push(new Uint8Array(0), true)
                            throw new Error('no reader')
                        }

                        while (true) {
                            const result = await Promise.race([
                                reader.read(),
                                new Promise<never>((_, rej) => setTimeout(() => rej(new Error('read timeout')), 5000)),
                            ])

                            if (!isReadResult(result)) {
                                pt.push(new Uint8Array(0), true)
                                throw new Error('invalid read result')
                            }

                            const { done, value } = result
                            if (done) break
                            pt.push(value)
                        }

                        pt.push(new Uint8Array(0), true)
                        count++
                        browser.runtime.sendMessage({
                            target: MsgTargetEnum.ServiceWorker,
                            id: data.id,
                            type: MsgTypeEnum.Progress,
                            data: Math.floor((count / total) * 100),
                        })
                        resolve()
                    } catch {
                        // CDN 容错：切换子域名重试
                        const idx = url.indexOf('//i') + 3
                        const currentNum = Number(url[idx])
                        if (!isNaN(currentNum) && currentNum < 5) {
                            const retryUrl = url.slice(0, idx) + (currentNum + 1) + url.slice(idx + 1)
                            // 递归去掉 pageIdx 参数
                            pool.add(() => downloadPage(retryUrl, pt))
                        }
                        reject()
                    }
                }
                run()
            })
        }

        for (let i = 0; i < pages.length; i++) {
            const ext = pages[i].path.split('.').pop() || 'webp'
            const url = `https://i1.nhentai.net/${pages[i].path}`
            const pt = new ZipPassThrough(`${pages[i].number}.${ext}`)
            pool.add(() => downloadPage(url, pt))
        }

        pool.setOnAllCompleted(() => {
            if (count === total) {
                zip.end()
                browser.runtime.sendMessage({
                    target: MsgTargetEnum.ServiceWorker,
                    id: data.id,
                    type: MsgTypeEnum.Success,
                })
            }
        })
    } catch (err) {
        console.error('Offscreen download error:', err)
    }
})

function isReadResult(obj: unknown): obj is ReadableStreamReadResult<Uint8Array> {
    return obj !== null && typeof obj === 'object' && 'done' in obj && 'value' in obj
}
