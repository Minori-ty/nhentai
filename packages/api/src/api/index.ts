import { SortEnum, type SortMode, type TagType } from '../enums'
import type { IGallery, IFavoriteResponse } from './info.d'
import { request } from './request'
import type { ITags } from './tags.d'
import type { ISearchResponse, IResult } from './types.d'
import type { IUserMe } from './user.d'

/** 搜索画廊的选项 */
export interface SearchGalleryOptions {
    /** 搜索关键字，默认 '' */
    query?: string
    /** 页码，从 1 开始，默认 1 */
    page?: number
    /** 排序方式，默认 date */
    sort?: SortMode
}

/** 获取收藏的选项 */
export interface GetFavoritesOptions {
    /** 页码，从 1 开始，默认 1 */
    page?: number
    /** 搜索关键字（在收藏中过滤），默认 '' */
    q?: string
}

/** 根据标签获取画廊的选项 */
export interface GetTagsOptions {
    /** 标签 ID（必填） */
    tag_id: number
    /** 页码，从 1 开始，默认 1 */
    page?: number
    /** 排序方式，默认 date */
    sort?: SortMode
}

/**
 * 搜索画廊。
 *
 * 支持关键词、精确短语、排除、标签过滤、数值过滤和日期过滤。
 * 公开接口，无需登录。传入 auth token 可提高速率限制。
 *
 * @param options - 搜索选项对象
 * @param options.query - 搜索关键字，默认 ''
 * @param options.page - 页码，从 1 开始，默认 1
 * @param options.sort - 排序方式，默认 date
 * @returns 搜索结果，含分页信息和画廊列表
 * @see https://nhentai.net/api/v2/docs#/search/search_galleries_api_v2_search_get
 */
export function searchGallery({
    query = '',
    page = 1,
    sort = SortEnum.Date,
}: SearchGalleryOptions): Promise<ISearchResponse> {
    return request('/search', {
        params: { query, page, sort },
    })
}

/**
 * 获取最新上传的画廊列表，按时间倒序。
 *
 * 相当于浏览 nhentai.net 首页。
 * 公开接口。
 *
 * @param page - 页码
 * @see https://nhentai.net/api/v2/docs#/galleries/get_all_galleries_api_v2_galleries_get
 */
export function getGallery(page: number): Promise<ISearchResponse> {
    return request('/galleries', {
        params: { page },
        auth: true,
    })
}

/**
 * 获取单个画廊的详细信息，包括所有页面、标签、标题。
 *
 * 传入 include=favorite 可附带当前用户的是否收藏标记。
 * 需要登录。
 *
 * @param id - 画廊 ID
 * @see https://nhentai.net/api/v2/docs#/galleries/get_gallery_api_v2_galleries__gallery_id__get
 */
export function getGalleryInfo(id: number): Promise<IGallery> {
    return request(`/galleries/${id}`, {
        params: { include: 'favorite' },
        auth: true,
    })
}

/**
 * 获取当前用户的收藏列表，按最新收藏时间倒序。
 *
 * 支持关键字筛选（在已收藏范围内搜索）。
 * 需要登录。
 *
 * @param options - 收藏搜索选项对象
 * @param options.page - 页码，从 1 开始，默认 1
 * @param options.q - 搜索关键字（在收藏中过滤），默认 ''
 * @returns 搜索结果，含分页信息和画廊列表
 * @see https://nhentai.net/api/v2/docs#/favorites/get_favorites_api_v2_favorites_get
 */
export function getFavorites({ page = 1, q = '' }: GetFavoritesOptions): Promise<ISearchResponse> {
    return request('/favorites', {
        params: { page, q },
        auth: true,
    })
}

/**
 * 切换画廊的收藏状态。
 *
 * favorited=true 时 POST 添加到收藏，favorited=false 时 DELETE 移除。
 * 返回更新后的收藏数和状态。
 * 需要登录。
 *
 * @param id - 画廊 ID
 * @param favorited - true 收藏 / false 取消收藏
 * @see https://nhentai.net/api/v2/docs#/galleries/favorite_gallery_api_v2_galleries__gallery_id__favorite_post
 */
export function favoriteGallery(id: number, favorited: boolean): Promise<IFavoriteResponse> {
    return request(`/galleries/${id}/favorite`, {
        method: favorited ? 'POST' : 'DELETE',
        auth: true,
    })
}

/**
 * 根据 slug 获取某个标签的详细信息。
 *
 * 适用所有标签类型：tag、group、artist、character、language、category。
 * 公开接口。
 *
 * @param type - 标签类型
 * @param name - 标签 slug 名称
 * @see https://nhentai.net/api/v2/docs#/tags/get_tag_info_api_v2_tags__tag_type___slug__get
 */
export function getTagInfo(type: TagType, name: string): Promise<ITags> {
    return request(`/tags/${type}/${name}`, {})
}

/**
 * 根据标签 id 获取该标签下的画廊列表。
 *
 * 注意：该接口不返回 total 字段。
 * 公开接口。
 *
 * @param options - 标签搜索选项对象
 * @param options.tag_id - 标签 ID（必填）
 * @param options.page - 页码，从 1 开始，默认 1
 * @param options.sort - 排序方式，默认 date
 * @returns 搜索结果（不含 total 字段）
 * @see https://nhentai.net/api/v2/docs#/galleries/get_galleries_tagged_api_v2_galleries_tagged_get
 */
export function getTags({
    page = 1,
    sort = SortEnum.Date,
    tag_id,
}: GetTagsOptions): Promise<Omit<ISearchResponse, 'total'> & { total: null }> {
    return request('/galleries/tagged', {
        params: { tag_id, sort, page },
    })
}

/**
 * 获取当前流行（热门）的 5 个画廊。
 *
 * 公开接口。始终返回固定 5 元组。
 *
 * @see https://nhentai.net/api/v2/docs#/galleries/get_popular_galleries_api_v2_galleries_popular_get
 */
export function getPopular(): Promise<[IResult, IResult, IResult, IResult, IResult]> {
    return request('/galleries/popular')
}

/**
 * 获取当前登录用户的个人资料。
 *
 * 返回 id、username、slug、avatar_url、theme、is_staff、is_superuser、
 * about、favorite_tags。email 字段仅在 User Token 认证时返回，
 * API Key 认证时返回 null。
 * 需要登录。
 *
 * @see https://nhentai.net/api/v2/docs#/user/get_me_api_v2_user_get
 */
export function getMe(): Promise<IUserMe> {
    return request('/user', { auth: true })
}

/**
 * 获取画廊的 ZIP 下载链接。
 *
 * POST 请求，返回一个短期有效的下载 URL 和过期时间戳。
 * 需要在 `expires_at`（unix 秒）之前 fetch 该 url 完成下载。
 *
 * **认证**：User Token 或 API Key
 *
 * **功能开关**：需管理员启用 `allow_downloads` 特性
 *
 * ### 速率限制（ZIP 格式）
 *
 * | 维度 | 限制 |
 * |------|------|
 * | 每 IP | 10 次 / 5 分钟 |
 * | 每用户 | 7 次 / 5 分钟 |
 * | 每 API Key 持有者 | 10 次 / 5 分钟 |
 *
 * ### 可能的状态码
 *
 * - `200` — 成功，返回 `{ url, expires_at }`
 * - `422` — 参数校验失败
 * - `429` — 超过速率限制
 * - `503` — 功能已被禁用
 *
 * @param id - 画廊 ID
 * @returns 包含 `url`（下载链接）和 `expires_at`（unix 秒级时间戳）的对象
 * @see https://nhentai.net/api/v2/docs#/galleries/issue_download_url_api_v2_galleries__gallery_id__download_post
 */
export function downloadZip(id: number): Promise<{ url: string; expires_at: number }> {
    return request(`/galleries/${id}/download?format=zip`, { auth: true, method: 'POST' })
}
