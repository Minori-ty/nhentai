/**
 * 当前登录用户的个人资料。
 *
 * 对应 GET /api/v2/user 的响应。
 * email 字段仅在使用 User Token 认证时返回，API Key 认证时为 null。
 */
export interface IUserMe {
    id: number
    username: string
    slug: string
    avatar_url: string
    theme: string
    is_staff: boolean
    is_superuser: boolean
    about: string
    favorite_tags: string
    email: string | null
}
