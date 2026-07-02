import Dexie from 'dexie'

// 1. 定义数据库
class MediaDB extends Dexie {
    media!: Dexie.Table<{ id?: number; media_id: number }, number>

    constructor() {
        super('nhentai-download')
        this.version(1).stores({
            media: '++id, media_id', // 自增 id，media_id 唯一索引
        })
    }
}

const db = new MediaDB()

// 2. 封装增删查操作
const MediaService = {
    // 添加 media_id，如果存在则忽略
    async addMedia(media_id: number) {
        const exists = await db.media.where({ media_id }).first()
        if (!exists) {
            await db.media.add({ media_id })
        }
    },

    // 删除 media_id
    async deleteMedia(media_id: number) {
        const item = await db.media.where({ media_id }).first()
        if (item) {
            await db.media.delete(item.id!)
        }
    },

    // 查找 media_id
    async hasMedia(media_id: number): Promise<boolean> {
        const item = await db.media.where({ media_id }).first()
        return !!item
    },

    // 获取所有 media_id（可选）
    async getAllMedia(): Promise<number[]> {
        const all = await db.media.toArray()
        return all.map((item) => item.media_id)
    },
}

export default MediaService
