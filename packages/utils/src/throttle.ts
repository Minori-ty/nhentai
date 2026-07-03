/**
 * 节流函数 — 替代 lodash-es/throttle，减少依赖体积。
 * 首次立即执行，后续在 delay 内最多执行一次（尾调用保证最后一次被触发）。
 */
export function throttle<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let lastTime = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const throttled = (...args: any[]) => {
        const now = Date.now()
        const remaining = delay - (now - lastTime)

        if (remaining <= 0) {
            lastTime = now
            timer = null
            fn(...args)
        } else if (!timer) {
            timer = setTimeout(() => {
                lastTime = Date.now()
                timer = null
                fn(...args)
            }, remaining)
        }
    }

    return throttled as T
}
