export interface IFavoriteResponse {
    favorited: boolean
    num_favorites: number
}

export interface IGallery {
    id: number
    media_id: string
    title: Title
    cover: Cover
    thumbnail: Thumbnail
    scanlator: string
    upload_date: number
    tags: Tag[]
    num_pages: number
    num_favorites: number
    pages: Page[]
    is_favorited: boolean
}

export interface Title {
    english: string
    japanese: string
    pretty: string
}

export interface Cover {
    path: string
    width: number
    height: number
}

export interface Thumbnail {
    path: string
    width: number
    height: number
}

export interface Tag {
    id: number
    type: string
    name: string
    slug: string
    url: string
    count: number
    description?: string
}

export interface Page {
    number: number
    path: string
    width: number
    height: number
    thumbnail: string
    thumbnail_width: number
    thumbnail_height: number
}
