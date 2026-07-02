// --- HTTP 客户端 ---
export { request } from './api/request'

// --- API 函数 ---
export {
    searchGallery,
    getGallery,
    getGalleryInfo,
    getFavorites,
    favoriteGallery,
    getTagInfo,
    getTags,
    downloadGallery,
    getPopular,
} from './api/index'

// --- 类型 ---
export type { ISearchResponse, IResult } from './api/index.d'
export type { IGallery, IFavoriteResponse, Title, Tag, Page, Cover, Thumbnail } from './api/info.d'
export type { ITags } from './api/tags'

// --- 枚举 ---
export { SortEnum, TagTypeEnum, MsgTypeEnum, MsgTargetEnum } from './enums'
export type { SortMode, TagType, MsgType, MsgTarget, TagRouteName } from './enums'
