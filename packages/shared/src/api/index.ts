import type { ISearchResponse, IResult } from './index.d'
import type { IGallery, IFavoriteResponse } from './info.d'
import type { ITags } from './tags'
import { SortEnum, type SortMode, type TagType } from '../enums'
import { request } from './request'

export function searchGallery({
    query = '',
    page = 1,
    sort = SortEnum.Date,
}: {
    query?: string
    page?: number
    sort?: SortMode
}): Promise<ISearchResponse> {
    return request('/search', {
        params: { query, page, sort },
        auth: false,
    })
}

export function getGallery(page: number): Promise<ISearchResponse> {
    return request('/galleries', {
        params: { page },
        auth: false,
    })
}

export function getGalleryInfo(id: number): Promise<IGallery> {
    return request(`/galleries/${id}`, {
        params: { include: 'related,suggestions,comments,favorite' },
        auth: false,
    })
}

export function getFavorites({ page = 1, q = '' }: { page?: number; q?: string }): Promise<ISearchResponse> {
    return request('/favorites', {
        params: { page, q },
    })
}

export function favoriteGallery(id: number, favorited: boolean): Promise<IFavoriteResponse> {
    return request(`/galleries/${id}/favorite`, {
        method: favorited ? 'POST' : 'DELETE',
    })
}

export function getTagInfo(type: TagType, name: string): Promise<ITags> {
    return request(`/tags/${type}/${name}`, {
        auth: false,
    })
}

export function getTags({
    page = 1,
    sort = SortEnum.Date,
    tag_id,
}: {
    page?: number
    sort?: SortMode
    tag_id: number
}): Promise<Omit<ISearchResponse, 'total'> & { total: null }> {
    return request('/galleries/tagged', {
        params: { tag_id, sort, page },
        auth: false,
    })
}

export function downloadGallery(id: number): Promise<{ url: string; expires_at: number }> {
    return request(`/galleries/${id}/download`, {
        method: 'POST',
        params: { format: 'zip' },
    })
}

export function getPopular(): Promise<[IResult, IResult, IResult, IResult, IResult]> {
    return request('/galleries/popular', {
        auth: false,
    })
}
