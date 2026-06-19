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
    comments: Comment[]
    comment_count: number
    related: Related[]
    is_favorited: boolean
    suggestions: Suggestions
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

export interface Comment {
    id: number
    gallery_id: number
    poster: Poster
    post_date: number
    body: string
}

export interface Poster {
    id: number
    username: string
    slug: string
    avatar_url: string
    is_superuser: boolean
    is_staff: boolean
}

export interface Related {
    id: number
    media_id: string
    english_title: string
    japanese_title: string
    thumbnail: string
    thumbnail_width: number
    thumbnail_height: number
    num_pages: number
    num_favorites: number
    tag_ids: number[]
    blacklisted: boolean
}

export interface Suggestions {
    trending: any[]
    active: any[]
    mine: any[]
    counts: Counts
}

export interface Counts {
    trending: number
    active: number
    declined: number
    hidden: number
}
