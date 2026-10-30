/** 标记已注入的 preconnect link，避免重复调用时无限堆积 */
const MARKER = 'nhPreconnect'

/**
 * 预连接图片 CDN 域名，减少图片加载时的 DNS + TCP + TLS 握手延迟。
 *
 * 幂等：重复调用不会重复插入 `<link>`（主入口与热点路径都可能触发，必须可安全重入）。
 */
export function preconnectImageCDNs() {
    const head = document.head
    if (!head) return

    for (let n = 1; n <= 4; n++) {
        for (const host of [`t${n}`, `i${n}`]) {
            if (head.querySelector(`link[data-${MARKER.toLowerCase()}="${host}"]`)) continue

            const link = document.createElement('link')
            link.rel = 'preconnect'
            link.href = `https://${host}.nhentai.net`
            link.crossOrigin = 'anonymous'
            link.dataset[MARKER] = host
            head.appendChild(link)
        }
    }
}
