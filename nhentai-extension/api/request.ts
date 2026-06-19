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

    const response = await fetch(url.toString(), { ...init, headers })
    return await response.json()
}
