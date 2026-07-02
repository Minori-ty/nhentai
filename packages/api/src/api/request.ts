const BASE_URL = 'https://nhentai.net/api/v2'

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

// 429 退避状态
let retries = 0
const MAX_RETRIES = 5
const BASE_DELAY = 60_000

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, auth = true, headers: extraHeaders, ...init } = options

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

    while (true) {
        const response = await fetch(url.toString(), { ...init, headers })

        if (response.ok) {
            retries = 0
            return await response.json()
        }

        if (response.status === 429 && retries < MAX_RETRIES) {
            retries++
            // 60s → 120s → 240s → 480s → 960s，加 ±25% 抖动
            const base = BASE_DELAY * Math.pow(2, retries - 1)
            const jitter = base * (0.75 + Math.random() * 0.5)
            await delay(jitter)
            continue
        }

        // 重试耗尽或非 429 错误：重置计数器，允许后续滚动重新触发请求
        retries = 0
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
}
