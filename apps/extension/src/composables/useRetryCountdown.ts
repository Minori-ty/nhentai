import { RequestError } from '@nhentai/api'
import { ref } from 'vue'

/** 429 限流重试等待秒数 */
const RETRY_DELAY = 60

/**
 * 429 请求限流重试倒计时。
 *
 * 捕获 `RequestError(429)` 后倒计时 `RETRY_DELAY` 秒再重试，
 * 期间通过 `retryCountdown` 暴露剩余秒数供 UI 显示底部倒计时条。
 *
 * @returns retryCountdown - 剩余重试秒数（0 表示未在重试）
 * @returns requestWithRetry - 包裹请求函数，自动处理 429 重试
 */
export function useRetryCountdown() {
    const retryCountdown = ref(0)

    async function requestWithRetry<T>(fn: () => Promise<T>): Promise<T> {
        try {
            return await fn()
        } catch (e: unknown) {
            if (e instanceof RequestError && e.status === 429) {
                for (let i = RETRY_DELAY; i > 0; i--) {
                    retryCountdown.value = i
                    await new Promise((r) => setTimeout(r, 1000))
                }
                retryCountdown.value = 0
                return await fn()
            }
            throw e
        }
    }

    return { retryCountdown, requestWithRetry }
}
