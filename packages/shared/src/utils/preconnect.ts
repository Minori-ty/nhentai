// 预连接 CDN 域名，减少图片加载时的 DNS + TCP + TLS 握手延迟
export function preconnectImageCDNs() {
    const origins = [
        'https://t1.nhentai.net',  // 缩略图主 CDN
        'https://i1.nhentai.net',  // 原图主 CDN
    ]
    for (const origin of origins) {
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = origin
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
    }
}
