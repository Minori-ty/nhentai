import Dexie from 'dexie'

interface MediaRow {
    id?: number
    media_id: number
}

// 1. 定义数据库
class MediaDB extends Dexie {
    media!: Dexie.Table<MediaRow, number>

    constructor() {
        super('nhentai-download')
        // media_id 保持普通索引而非 `&media_id` 唯一索引：
        // 老库里可能已存在重复行，加唯一索引会让 upgrade 直接失败（ConstraintError），
        // 而这份数据只是「已下载」标记、丢了也不影响功能，没必要为它冒迁移风险。
        // 去重改由 addMedia 的事务保证。
        this.version(1).stores({
            media: '++id, media_id',
        })
    }
}

const db = new MediaDB()

// 2. 封装增删查操作
const MediaService = {
    /** 添加 media_id，已存在则忽略。查与写放在同一个事务里，避免并发完成时插入重复行 */
    async addMedia(media_id: number) {
        await db.transaction('rw', db.media, async () => {
            const exists = await db.media.where('media_id').equals(media_id).first()
            if (!exists) {
                await db.media.add({ media_id })
            }
        })
    },

    /** 删除 media_id（按索引批量删，顺带清掉历史重复行） */
    async deleteMedia(media_id: number) {
        await db.media.where('media_id').equals(media_id).delete()
    },

    /** 是否存在 */
    async hasMedia(media_id: number): Promise<boolean> {
        return (await db.media.where('media_id').equals(media_id).count()) > 0
    },

    /**
     * 批量查询已下载的 id。
     *
     * 替代逐个 `hasMedia()` 的 N+1 查询：一页 25 条从 25 次索引查找降到 1 次。
     */
    async getDownloadedIds(ids: number[]): Promise<Set<number>> {
        if (ids.length === 0) return new Set()
        const rows = await db.media.where('media_id').anyOf(ids).toArray()
        return new Set(rows.map((row) => row.media_id))
    },

    /** 获取所有 media_id */
    async getAllMedia(): Promise<number[]> {
        const all = await db.media.toArray()
        return all.map((item) => item.media_id)
    },
}

export default MediaService
