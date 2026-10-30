const BASE_URL = 'https://nhentai.net/api/v2'

/** 单个请求的超时时间（毫秒）。防止弱网/服务端挂起导致 Promise 永远 pending */
const REQUEST_TIMEOUT = 20_000

/** 从站点 cookie 读取 access token（仅浏览器页面上下文可用） */
function getAccessToken(): string {
    return (
        document.cookie
            .split('; ')
            .find((row) => row.startsWith('access_token='))
            ?.split('=')[1] || ''
    )
}

interface RequestOptions extends Omit<RequestInit, 'headers'> {
    params?: Record<string, string | number>
    headers?: Record<string, string>
    auth?: boolean
}

export class RequestError extends Error {
    constructor(
        message: string,
        public status: number,
        /** 响应体原文（截断），便于排查 4xx/5xx 的真实原因 */
        public body?: string,
    ) {
        super(message)
        this.name = 'RequestError'
    }
}

/** 读取响应体：能解析成 JSON 就返回 json，否则只返回原文 */
async function parseBody(response: Response): Promise<{ json?: unknown; text: string }> {
    const text = await response.text().catch(() => '')
    if (!text) return { text: '' }
    try {
        return { json: JSON.parse(text) as unknown, text }
    } catch {
        return { text }
    }
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, auth = false, headers: extraHeaders, ...init } = options

    const url = new URL(BASE_URL + path)
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, String(value))
        }
    }

    const headers: Record<string, string> = { ...extraHeaders }
    if (auth) {
        const token = getAccessToken()
        if (token) {
            headers['authorization'] = `User ${token}`
        }
    }

    const signal = init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT)
    const response = await fetch(url.toString(), { ...init, headers, signal })

    const { json, text } = await parseBody(response)

    if (!response.ok) {
        throw new RequestError(
            `Request failed: ${response.status} ${response.statusText}`,
            response.status,
            text.slice(0, 500),
        )
    }

    // 204 / 空响应体：不要交给 JSON.parse，否则会抛 SyntaxError
    return (json ?? null) as T
}
