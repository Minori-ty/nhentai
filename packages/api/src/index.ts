// --- HTTP 客户端 ---
export { request, RequestError } from './api/request'

// --- API 函数 ---
export {
    searchGallery,
    getGallery,
    getGalleryInfo,
    getFavorites,
    favoriteGallery,
    getTagInfo,
    getTags,
    getPopular,
    getMe,
    downloadZip,
} from './api/index'

// --- 类型 ---
export type { SearchGalleryOptions, GetFavoritesOptions, GetTagsOptions } from './api/index'
export type { ISearchResponse, IResult } from './api/types.d'
export type { IGallery, IFavoriteResponse, Title, Tag, Page, Cover, Thumbnail } from './api/info.d'
export type { ITags } from './api/tags.d'
export type { IUserMe } from './api/user.d'

// --- 枚举 ---
export { SortEnum, TagTypeEnum, MsgTypeEnum, MsgTargetEnum } from './enums'
export type { SortMode, TagType, MsgType, MsgTarget, TagRouteName } from './enums'
